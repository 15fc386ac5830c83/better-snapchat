import React from 'react';
import useSettingState from '../../../../hooks/useSettingState';
import { Switch } from '@mantine/core';

const NAME = 'Raw Event Logging';
const DESCRIPTION = 'Log raw event payloads (websocket events, API calls, etc.) to the console for debugging.';

function RawEventLogging() {
  const [enabled, setEnabled] = useSettingState('RAW_EVENT_LOGGING');
  return <Switch label={NAME} description={DESCRIPTION} checked={enabled} onChange={() => setEnabled(!enabled)} />;
}

export default {
  name: NAME,
  description: DESCRIPTION,
  component: RawEventLogging,
};
