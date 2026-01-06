import settings from '../../lib/settings';
import Module from '../../lib/module';
import { getConversation, getSnapchatPublicUser, getSnapchatStore } from '../../utils/snapchat';
import { logInfo, logRawEvent } from '../../lib/debug';
import { PresenceActionMap, PresenceState } from '../../lib/constants';

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

const store = getSnapchatStore();

let oldOnActiveConversationInfoUpdated: any = null;
let newOnActiveConversationInfoUpdated: any = null;

function sendPresenceNotification({
  user,
  presenceState,
  conversation,
  conversationId,
}: {
  user: any;
  presenceState: PresenceState;
  conversation: any;
  conversationId?: string;
}) {
  const ntfyIgnoredNames = settings.getSetting('NTFY_IGNORED_NAMES');
  const {
    username,
    bitmoji_avatar_id: bitmojiAvatarId,
    bitmoji_selfie_id: bitmojiSelfieId,
    display_name: displayName,
  } = user;
  const conversationTitle = conversation?.title ?? 'your Chat';
  const navigationPath = `/web/${conversationId}`;
  const action = PresenceActionMap[presenceState](conversationTitle);

  const ignoredNames = typeof ntfyIgnoredNames === 'string' ? JSON.parse(ntfyIgnoredNames) : [];
  if (
    ignoredNames.includes(displayName) ||
    ignoredNames.includes(username) ||
    ignoredNames.includes(conversationTitle)
  ) {
    return;
  }

  let iconUrl = undefined;
  if (bitmojiSelfieId != null && bitmojiAvatarId != null) {
    iconUrl = `https://sdk.bitmoji.com/render/panel/${bitmojiSelfieId}-${bitmojiAvatarId}-v1.webp?transparent=1&trim=circle&scale=1`;
  } else if (bitmojiAvatarId != null) {
    iconUrl = `https://sdk.bitmoji.com/render/panel/${bitmojiAvatarId}-v1.webp?transparent=1&trim=circle&scale=1`;
  }

  const notificationOptions = {
    body: action,
    icon: iconUrl,
    data: { url: navigationPath },
  };

  const notification = new Notification(displayName ?? username, notificationOptions);

  notification.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      window.focus();
      window.history.pushState({}, '', navigationPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
      notification.close();
    },
    { once: true },
  );

  return notification;
}

function sendDiscordWebhook({
  user,
  presenceState,
  conversation,
  conversationId,
}: {
  user: any;
  presenceState: PresenceState;
  conversation: any;
  conversationId?: string;
}) {
  const discordWebhookUrl = settings.getSetting('PRESENCE_LOGGING_DISCORD_WEBHOOK_URL');
  if (!discordWebhookUrl) {
    return;
  }

  const {
    username,
    bitmoji_avatar_id: bitmojiAvatarId,
    bitmoji_selfie_id: bitmojiSelfieId,
    display_name: displayName,
  } = user;
  const conversationTitle = conversation?.title ?? 'your Chat';
  const action = PresenceActionMap[presenceState](conversationTitle);
  const timestamp = getTimestamp();

  let iconUrl = undefined;
  if (bitmojiSelfieId != null && bitmojiAvatarId != null) {
    iconUrl = `https://sdk.bitmoji.com/render/panel/${bitmojiSelfieId}-${bitmojiAvatarId}-v1.webp?transparent=1&trim=circle&scale=1`;
  } else if (bitmojiAvatarId != null) {
    iconUrl = `https://sdk.bitmoji.com/render/panel/${bitmojiAvatarId}-v1.webp?transparent=1&trim=circle&scale=1`;
  }

  const requestId = Math.random().toString(36).substring(7);

  window.postMessage(
    {
      type: 'BETTERSNAP_TO_BACKGROUND',
      requestId,
      payload: {
        type: 'SEND_DISCORD_WEBHOOK',
        data: {
          webhookUrl: discordWebhookUrl,
          username: displayName ?? username,
          content: action,
          iconUrl: iconUrl,
          timestamp: timestamp,
        },
      },
    },
    '*',
  );
}

const userPresenceMap: Map<string, PresenceState> = new Map();
const userPresenceTracking: Map<string, boolean> = new Map(); // Track if user was previously present
const serializeUserConversationId = (userId: string, conversationId?: string) =>
  `${userId}:${conversationId ?? 'direct'}`;

async function handleOnActiveConversationInfoUpdated(activeConversationInfo: any) {
  logRawEvent('onActiveConversationInfoUpdated', activeConversationInfo);

  const halfSwipeNotificationEnabled = settings.getSetting('HALF_SWIPE_NOTIFICATION');
  const presenceLoggingEnabled = settings.getSetting('PRESENCE_LOGGING');

  const currentlyPeekingUsers = new Set<string>();
  const currentlyTypingOrIdleUsers = new Set<string>();
  const currentlyPresentUsers = new Set<string>(); // Track all users who are present

  for (const [
    conversationId,
    { peekingParticipants, typingParticipants, presentParticipants },
  ] of activeConversationInfo.entries()) {
    const conversation = getConversation(conversationId)?.conversation;
    const conversationTitle = conversation?.title ?? 'your Chat';

    // Track all currently present users from presentParticipants
    const currentPresentUserIds = new Set<string>();
    if (presentParticipants && Array.isArray(presentParticipants)) {
      for (const userId of presentParticipants) {
        currentPresentUserIds.add(userId);
        const serializedId = serializeUserConversationId(userId, conversationId);
        currentlyPresentUsers.add(serializedId);
      }
    }

    // Check for users who just joined (in presentParticipants but not previously tracked)
    if (presentParticipants && Array.isArray(presentParticipants)) {
      for (const userId of presentParticipants) {
        const serializedId = serializeUserConversationId(userId, conversationId);
        const wasPreviouslyPresent = userPresenceTracking.get(serializedId);
        const isPeeking = peekingParticipants.includes(userId);
        const isTyping = typingParticipants.some((tp: any) => tp.userId === userId);

        // Only log "joined" and mark as present if user is not actively typing or peeking (just presence)
        // and they weren't previously tracked
        if (!wasPreviouslyPresent && !isPeeking && !isTyping) {
          userPresenceTracking.set(serializedId, true);

          if (presenceLoggingEnabled) {
            const user = await getSnapchatPublicUser(userId);
            const action = PresenceActionMap[PresenceState.JOINED](conversationTitle);
            const timestamp = getTimestamp();
            logInfo(`[${timestamp}] ${user.display_name ?? user.username}:`, action);

            sendDiscordWebhook({
              user,
              conversation,
              conversationId,
              presenceState: PresenceState.JOINED,
            });
          }
        } else if (!wasPreviouslyPresent && !isPeeking) {
          // Mark as present if they're typing (but not peeking) to track for leave detection
          userPresenceTracking.set(serializedId, true);
        }
      }
    }

    for (const userId of peekingParticipants) {
      const user = await getSnapchatPublicUser(userId);

      const serializedId = serializeUserConversationId(userId, conversationId);
      const previousState = userPresenceMap.get(serializedId);

      currentlyPeekingUsers.add(serializedId);
      // Don't mark peeking users as present - they're not actually in the chat

      if (previousState === PresenceState.PEEKING) {
        continue;
      }

      if (presenceLoggingEnabled) {
        const action = PresenceActionMap[PresenceState.PEEKING](conversationTitle);
        const timestamp = getTimestamp();
        logInfo(`[${timestamp}] ${user.display_name ?? user.username}:`, action);

        sendDiscordWebhook({
          user,
          conversation,
          conversationId,
          presenceState: PresenceState.PEEKING,
        });
      }

      if (halfSwipeNotificationEnabled) {
        sendPresenceNotification({
          user,
          conversation,
          conversationId,
          presenceState: PresenceState.PEEKING,
        });
      }

      userPresenceMap.set(serializedId, PresenceState.PEEKING);
    }

    for (const { userId, typingState } of typingParticipants) {
      const user = await getSnapchatPublicUser(userId);
      const presenceState = typingState === 1 ? PresenceState.TYPING : PresenceState.IDLE;

      const serializedId = serializeUserConversationId(userId, conversationId);
      const previousState = userPresenceMap.get(serializedId);

      currentlyTypingOrIdleUsers.add(serializedId);
      // Only mark as present if they're in presentParticipants (not just peeking)
      const isInPresentParticipants = presentParticipants && presentParticipants.includes(userId);
      if (isInPresentParticipants && !userPresenceTracking.get(serializedId)) {
        userPresenceTracking.set(serializedId, true);
      }

      if (previousState === presenceState) {
        continue;
      }

      if (presenceLoggingEnabled) {
        const action = PresenceActionMap[presenceState](conversationTitle);
        const timestamp = getTimestamp();
        logInfo(`[${timestamp}] ${user.display_name ?? user.username}:`, action);

        sendDiscordWebhook({
          user,
          conversation,
          conversationId,
          presenceState,
        });
      }

      userPresenceMap.set(serializedId, presenceState);
    }
  }

  // Check for users who left (were present but are no longer in presentParticipants)
  for (const [serializedId, wasPresent] of userPresenceTracking.entries()) {
    if (wasPresent && !currentlyPresentUsers.has(serializedId)) {
      // Don't log "left" if user is currently peeking
      if (currentlyPeekingUsers.has(serializedId)) {
        continue;
      }

      // User left
      userPresenceTracking.delete(serializedId);

      if (presenceLoggingEnabled) {
        const parts = serializedId.split(':');
        if (parts[0] && parts[1]) {
          const userId = parts[0];
          const conversationId = parts[1] === 'direct' ? undefined : parts[1];
          const user = await getSnapchatPublicUser(userId);
          const conversation = conversationId ? getConversation(conversationId)?.conversation : null;
          const conversationTitle = conversation?.title ?? 'your Chat';
          const action = PresenceActionMap[PresenceState.LEFT](conversationTitle);
          const timestamp = getTimestamp();
          logInfo(`[${timestamp}] ${user.display_name ?? user.username}:`, action);

          sendDiscordWebhook({
            user,
            conversation,
            conversationId,
            presenceState: PresenceState.LEFT,
          });
        }
      }
    }
  }

  // Clear peeking state for users who stopped peeking
  for (const [serializedId, state] of userPresenceMap.entries()) {
    if (state === PresenceState.PEEKING && !currentlyPeekingUsers.has(serializedId)) {
      userPresenceMap.delete(serializedId);
    }
  }

  // Clear typing/idle state for users who stopped typing/idling
  for (const [serializedId, state] of userPresenceMap.entries()) {
    if (
      (state === PresenceState.TYPING || state === PresenceState.IDLE) &&
      !currentlyTypingOrIdleUsers.has(serializedId)
    ) {
      userPresenceMap.delete(serializedId);
    }
  }
}

class PresenceLogging extends Module {
  constructor() {
    super('Presence Logging');
    store.subscribe((storeState: any) => storeState.presence, this.load);
    settings.on('PRESENCE_LOGGING.setting:update', () => this.load());
    settings.on('HALF_SWIPE_NOTIFICATION.setting:update', () => this.load());
    settings.on('PRESENCE_LOGGING_DISCORD_WEBHOOK_URL.setting:update', () => this.load());
  }

  load(presenceClient?: any) {
    presenceClient = presenceClient ?? store.getState().presence;
    if (presenceClient == null) {
      return;
    }

    const halfSwipeNotificationEnabled = settings.getSetting('HALF_SWIPE_NOTIFICATION');
    const presenceLoggingEnabled = settings.getSetting('PRESENCE_LOGGING');
    const enabled = halfSwipeNotificationEnabled || presenceLoggingEnabled;
    const changedValues: any = {};

    if (enabled && presenceClient.onActiveConversationInfoUpdated !== newOnActiveConversationInfoUpdated) {
      oldOnActiveConversationInfoUpdated = presenceClient.onActiveConversationInfoUpdated;

      newOnActiveConversationInfoUpdated = new Proxy(oldOnActiveConversationInfoUpdated, {
        apply(targetFunc: any, thisArg: any, [activeConversationPayload, ...rest]: any) {
          handleOnActiveConversationInfoUpdated(activeConversationPayload);
          return Reflect.apply(targetFunc, thisArg, [activeConversationPayload, ...rest]);
        },
      });

      changedValues.onActiveConversationInfoUpdated = newOnActiveConversationInfoUpdated;
    }

    if (!enabled && oldOnActiveConversationInfoUpdated != null) {
      changedValues.onActiveConversationInfoUpdated = oldOnActiveConversationInfoUpdated;
      oldOnActiveConversationInfoUpdated = null;
      userPresenceMap.clear();
      userPresenceTracking.clear();
    }

    if (Object.keys(changedValues).length === 0) {
      return;
    }

    store.setState({ presence: { ...presenceClient, ...changedValues } });
  }
}

export default new PresenceLogging();
