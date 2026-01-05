import React from 'react';
import useSettingState from '../../../../hooks/useSettingState';
import { Switch, TextInput, Stack } from '@mantine/core';

const NAME = 'Presence Logging';
const DESCRIPTION = 'Log presence changes to the dev-console.';
const DISCORD_WEBHOOK_LABEL = 'Discord Webhook URL';
const DISCORD_WEBHOOK_PLACEHOLDER = 'Enter your Discord webhook URL';

function PresenceLogging() {
  const [enabled, setEnabled] = useSettingState('PRESENCE_LOGGING');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useSettingState('PRESENCE_LOGGING_DISCORD_WEBHOOK_URL');

  return (
    <Stack>
      <Switch label={NAME} description={DESCRIPTION} checked={enabled} onChange={() => setEnabled(!enabled)} />
      <TextInput
        label={DISCORD_WEBHOOK_LABEL}
        placeholder={DISCORD_WEBHOOK_PLACEHOLDER}
        value={discordWebhookUrl}
        onChange={(event) => setDiscordWebhookUrl(event.currentTarget.value)}
        disabled={!enabled}
        style={{ maxWidth: '300px' }}
      />
    </Stack>
  );
}

export default {
  name: [NAME, DISCORD_WEBHOOK_LABEL],
  description: [DESCRIPTION, 'Send presence logging notifications to Discord'],
  component: PresenceLogging,
};
