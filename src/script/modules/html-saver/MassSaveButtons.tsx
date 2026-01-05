import React from 'react';
import { save, unsave } from './saver';
import { createProgressCallbacks } from './progress-callbacks';

export default function MassSaveButtons() {
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUnsaving, setIsUnsaving] = React.useState(false);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginRight: 10, gap: 10 }}>
      <button
        style={{ width: '100%' }}
        type="button"
        onClick={async () => {
          setIsSaving(true);
          await save(createProgressCallbacks('save'));
          setIsSaving(false);
        }}
        disabled={isSaving || isUnsaving}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      <button
        style={{ width: '100%' }}
        type="button"
        onClick={async () => {
          setIsUnsaving(true);
          await unsave(createProgressCallbacks('unsave'));
          setIsUnsaving(false);
        }}
        disabled={isSaving || isUnsaving}
      >
        {isUnsaving ? 'Unsaving...' : 'Unsave'}
      </button>
    </div>
  );
}
