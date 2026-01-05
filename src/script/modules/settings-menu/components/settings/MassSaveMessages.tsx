import React from 'react';
import { MassSaveButtons } from '../../../html-saver';

const NAME = 'Mass Save Messages';
const DESCRIPTION = 'Save or unsave all messages in the current open conversation.';

function MassSaveMessages() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <span>{NAME}</span>
      <span style={{ fontSize: 14, color: 'gray' }}>{DESCRIPTION}</span>
      <div style={{ marginTop: 10 }}>
        <MassSaveButtons />
      </div>
    </div>
  );
}

export default {
  name: NAME,
  description: DESCRIPTION,
  component: MassSaveMessages,
};
