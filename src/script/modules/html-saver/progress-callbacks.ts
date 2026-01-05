import { type SaveProgressCallbacks } from './saver';
import { type MassSaveProgressState } from './MassSaveProgress';

let progressState: MassSaveProgressState = {
  isActive: false,
  operation: null,
  totalElements: 0,
  processedCount: 0,
  currentChunk: 0,
  totalChunks: 0,
  elapsed: 0,
  estimatedRemaining: 0,
  isCancelled: false,
};

export function setProgressStateUpdater(updater: (state: MassSaveProgressState) => void) {
  updateProgressState = updater;
}

let updateProgressState = (newState: MassSaveProgressState) => {
  progressState = newState;
};

export function createProgressCallbacks(operation: 'save' | 'unsave'): SaveProgressCallbacks {
  return {
    onStart: (totalElements, totalChunks) => {
      updateProgressState({
        isActive: true,
        operation,
        totalElements,
        processedCount: 0,
        currentChunk: 0,
        totalChunks,
        elapsed: 0,
        estimatedRemaining: 0,
        isCancelled: false,
      });
    },
    onProgress: (processedCount, totalElements, currentChunk, totalChunks, elapsed, estimatedRemaining) => {
      updateProgressState({
        isActive: true,
        operation,
        totalElements,
        processedCount,
        currentChunk,
        totalChunks,
        elapsed,
        estimatedRemaining,
        isCancelled: false,
      });
    },
    onComplete: () => {
      updateProgressState({
        isActive: false,
        operation: null,
        totalElements: 0,
        processedCount: 0,
        currentChunk: 0,
        totalChunks: 0,
        elapsed: 0,
        estimatedRemaining: 0,
        isCancelled: false,
      });
    },
  };
}

