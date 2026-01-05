import { render, h } from 'preact';
import Module from '../../lib/module';
import { cancelSave, cancelUnsave } from './saver';
import MassSaveProgress, { type MassSaveProgressState } from './MassSaveProgress';
import ThemeProvider from '../../theme/ThemeProvider';
import { setProgressStateUpdater } from './progress-callbacks';

const CONTAINER_ID = 'html-saver-progress';

let container: HTMLDivElement | null = null;
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

function updateProgressState(newState: MassSaveProgressState) {
  progressState = newState;
  renderProgress();
}

// Set the updater function for progress-callbacks
setProgressStateUpdater(updateProgressState);

function renderProgress() {
  if (container == null) {
    container = document.createElement('div');
    container.setAttribute('id', CONTAINER_ID);
    document.body.appendChild(container);
  }

  const handleCancel = () => {
    if (progressState.operation === 'save') {
      cancelSave();
    } else if (progressState.operation === 'unsave') {
      cancelUnsave();
    }
    updateProgressState({
      ...progressState,
      isCancelled: true,
    });
  };

  const handleClose = () => {
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
  };

  render(
    h(ThemeProvider, {},
      h(MassSaveProgress, {
        state: progressState,
        onCancel: handleCancel,
        onClose: handleClose,
      })
    ),
    container,
  );
}

export { createProgressCallbacks } from './progress-callbacks';

class HtmlSaver extends Module {
  constructor() {
    super('HtmlSaver');
  }

  load(): void {
    // Module is ready, progress UI will be rendered when needed
  }
}

export { default as MassSaveButtons } from './MassSaveButtons';

export default new HtmlSaver();

