import { PresenceState } from './constants';
import settings from './settings';

const PREFIX = '[Better-Snap]';
const DEBUG_PREFIX = '[Better-Snap Debug]';

let iframeContentWindow: any | null = null;

// Cache for deduplicating event logs
const lastEventPayloads = new Map<string, string>();
const lastEventTimestamps = new Map<string, number>();
const THROTTLE_MS = 100; // Minimum time between logs for the same event (even if payload changed)

export function getIframeContentWindow() {
  if (iframeContentWindow != null) {
    return iframeContentWindow;
  }

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  (document.head ?? document.documentElement).appendChild(iframe);
  iframeContentWindow = iframe.contentWindow;
  return iframeContentWindow;
}

export function logInfo(...args: unknown[]) {
  const { console } = getIframeContentWindow();
  console.log(`%c${PREFIX}`, 'color: #3b5bdb', ...args);
}

export function logError(...args: unknown[]) {
  const { console } = getIframeContentWindow();
  console.error(PREFIX, ...args);
}

function serializePayload(payload: any): string {
  try {
    // Handle Map objects
    if (payload instanceof Map) {
      const obj: any = {};
      for (const [key, value] of payload.entries()) {
        obj[key] = value;
      }
      return JSON.stringify(obj);
    }
    // Handle Set objects
    if (payload instanceof Set) {
      return JSON.stringify(Array.from(payload));
    }
    // Regular objects
    return JSON.stringify(payload);
  } catch (error) {
    // Fallback: use string representation if JSON.stringify fails
    return String(payload);
  }
}

export function logRawEvent(eventName: string, payload: any) {
  if (!settings.getSetting('RAW_EVENT_LOGGING')) {
    return;
  }

  const { console } = getIframeContentWindow();
  try {
    // Serialize payload for comparison
    const payloadString = serializePayload(payload);
    const lastPayload = lastEventPayloads.get(eventName);
    const lastTimestamp = lastEventTimestamps.get(eventName) || 0;
    const now = Date.now();

    // Skip if payload is identical to last one
    if (payloadString === lastPayload) {
      return;
    }

    // Throttle: skip if same event was logged very recently (even if payload changed)
    if (now - lastTimestamp < THROTTLE_MS) {
      return;
    }

    // Update cache
    lastEventPayloads.set(eventName, payloadString);
    lastEventTimestamps.set(eventName, now);

    const timestamp = new Date().toISOString();
    console.group(`%c${DEBUG_PREFIX} ${eventName}`, 'color: #ff6b6b; font-weight: bold');
    console.log(`%cTimestamp:`, 'color: #868e96', timestamp);
    console.log(`%cPayload:`, 'color: #868e96', payload);

    // Serialize for display
    let serializedPayload: string;
    try {
      if (payload instanceof Map) {
        const obj: any = {};
        for (const [key, value] of payload.entries()) {
          obj[key] = value;
        }
        serializedPayload = JSON.stringify(obj, null, 2);
      } else if (payload instanceof Set) {
        serializedPayload = JSON.stringify(Array.from(payload), null, 2);
      } else {
        serializedPayload = JSON.stringify(payload, null, 2);
      }
    } catch {
      serializedPayload = String(payload);
    }

    console.log(`%cPayload (JSON):`, 'color: #868e96', serializedPayload);
    console.groupEnd();
  } catch (error) {
    console.error(`${DEBUG_PREFIX} Error logging raw event:`, error);
  }
}
