import React from 'react';
import { ActionIcon, Paper, Progress, Text, Button, Stack } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import styles from './MassSaveProgress.module.css';

export interface MassSaveProgressState {
  isActive: boolean;
  operation: 'save' | 'unsave' | null;
  totalElements: number;
  processedCount: number;
  currentChunk: number;
  totalChunks: number;
  elapsed: number;
  estimatedRemaining: number;
  isCancelled: boolean;
}

interface MassSaveProgressProps {
  state: MassSaveProgressState;
  onCancel: () => void;
  onClose: () => void;
}

export default function MassSaveProgress({ state, onCancel, onClose }: MassSaveProgressProps) {
  if (!state.isActive) {
    return null;
  }

  const progressPercent = state.totalElements > 0 ? (state.processedCount / state.totalElements) * 100 : 0;
  const operationName = state.operation === 'save' ? 'Saving' : 'Unsaving';

  return (
    <Paper className={styles.container} shadow="md" p="md" withBorder>
      <Stack gap="xs">
        <div className={styles.header}>
          <Text fw={600} size="sm">
            {operationName} Messages
          </Text>
          <ActionIcon size="sm" variant="subtle" onClick={onClose}>
            <IconX size={14} />
          </ActionIcon>
        </div>

        <Progress value={progressPercent} size="sm" animated />

        <div className={styles.stats}>
          <Text size="xs" c="dimmed">
            {state.processedCount} / {state.totalElements} ({progressPercent.toFixed(1)}%)
          </Text>
          <Text size="xs" c="dimmed">
            Chunk {state.currentChunk} / {state.totalChunks}
          </Text>
        </div>

        <div className={styles.stats}>
          <Text size="xs" c="dimmed">
            Elapsed: {(state.elapsed / 1000).toFixed(1)}s
          </Text>
          {state.estimatedRemaining > 0 && (
            <Text size="xs" c="dimmed">
              Est. remaining: ~{state.estimatedRemaining}s
            </Text>
          )}
        </div>

        {!state.isCancelled && (
          <Button size="xs" variant="light" color="red" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        )}

        {state.isCancelled && (
          <Text size="xs" c="red" ta="center">
            Cancelling...
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

