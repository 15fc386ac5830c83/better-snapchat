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
    const { webhookUrl, username, content, iconUrl, timestamp } = request.data;

    const embed = {
      title: username,
      description: content,
      timestamp: new Date().toISOString(),
      color: 0x3b5bdb, // Better-Snap brand color
    };

    const payload: any = {
      embeds: [embed],
    };

    if (iconUrl) {
      embed['thumbnail'] = { url: iconUrl };
    }

    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          console.log('Discord webhook sent successfully');
          sendResponse({ success: true, status: response.status });
        } else {
          console.error('Failed to send Discord webhook:', response.status, response.statusText);
          sendResponse({ success: false, error: `HTTP ${response.status}: ${response.statusText}` });
        }
      })
      .catch((error) => {
        console.error('Failed to send Discord webhook:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});
