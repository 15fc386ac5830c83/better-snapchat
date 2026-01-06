// Rate limiting for Discord webhooks (30 requests per minute = 1 every 2 seconds)
const webhookQueue: Array<{
  webhookUrl: string;
  payload: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];
let isProcessingQueue = false;
const WEBHOOK_THROTTLE_MS = 2000; // 2 seconds between requests

async function processWebhookQueue() {
  if (isProcessingQueue || webhookQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (webhookQueue.length > 0) {
    const { webhookUrl, payload, resolve, reject } = webhookQueue.shift()!;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('Discord webhook sent successfully');
        resolve({ success: true, status: response.status });
      } else {
        console.error('Failed to send Discord webhook:', response.status, response.statusText);
        reject({ success: false, error: `HTTP ${response.status}: ${response.statusText}` });
      }
    } catch (error: any) {
      console.error('Failed to send Discord webhook:', error);
      reject({ success: false, error: error.message });
    }

    // Throttle: wait before processing next webhook (unless queue is empty)
    if (webhookQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, WEBHOOK_THROTTLE_MS));
    }
  }

  isProcessingQueue = false;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SEND_NTFY_NOTIFICATION') {
    const { topic, title, body, iconUrl, clickUrl, priority } = request.data;

    const encodeHeaderValue = (value: string) => {
      if (/[^\x00-\x7F]/.test(value)) {
        return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(value)))}?=`;
      }
      return value;
    };

    const headers: Record<string, string> = {
      Icon: iconUrl,
      Title: encodeHeaderValue(title),
      Priority: priority?.toString() || '3',
      Click: clickUrl,
    };

    fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      body: body,
      headers: headers,
    })
      .then((response) => {
        console.log('ntfy notification sent successfully');
        sendResponse({ success: true, status: response.status });
      })
      .catch((error) => {
        console.error('Failed to send ntfy notification:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  if (request.type === 'SEND_DISCORD_WEBHOOK') {
    const { webhookUrl, username, content, iconUrl, timestamp, timestampISO } = request.data;

    // Use the provided timestamp ISO or fallback to current time
    const embedTimestamp = timestampISO || new Date().toISOString();
    // Include formatted timestamp with seconds in the footer
    const formattedTimestamp = timestamp || new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const embed: any = {
      title: username,
      description: content,
      timestamp: embedTimestamp,
      footer: {
        text: formattedTimestamp,
      },
      color: 0x3b5bdb, // Better-Snap brand color
    };

    const payload: any = {
      embeds: [embed],
    };

    if (iconUrl) {
      embed['thumbnail'] = { url: iconUrl };
    }

    // Queue the webhook request with rate limiting
    new Promise((resolve, reject) => {
      webhookQueue.push({ webhookUrl, payload, resolve, reject });
      processWebhookQueue();
    })
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        sendResponse(error);
      });

    return true;
  }
});
