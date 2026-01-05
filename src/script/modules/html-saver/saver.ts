import { logInfo } from '../../lib/debug';

const chunkSize = 10;
const delay = 1000;

export interface SaveProgressCallbacks {
  onStart?: (totalElements: number, totalChunks: number) => void;
  onProgress?: (
    processedCount: number,
    totalElements: number,
    currentChunk: number,
    totalChunks: number,
    elapsed: number,
    estimatedRemaining: number,
  ) => void;
  onComplete?: (totalProcessed: number, totalTime: number) => void;
}

let saveCancelled = false;
let unsaveCancelled = false;

export async function save(callbacks?: SaveProgressCallbacks) {
  const startTime = Date.now();
  const elements: HTMLDivElement[] = Array.from(
    document.querySelectorAll('.MibAa > li .p8r1z:has(> :is(span, audio)):not(.gHTq4 .p8r1z)'),
  );
  const totalElements = elements.length;
  const totalChunks = Math.ceil(totalElements / chunkSize);
  saveCancelled = false;

  logInfo('=== MASS SAVE MESSAGES - START ===');
  logInfo(`📊 Stats:`, {
    totalElements,
    chunkSize,
    totalChunks,
    estimatedTime: `${Math.ceil(((totalChunks - 1) * delay) / 1000)}s`,
    startTime: new Date(startTime).toLocaleTimeString(),
  });

  callbacks?.onStart?.(totalElements, totalChunks);

  if (totalElements === 0) {
    logInfo('⚠️ No elements found to save. Done.');
    return;
  }

  let processedCount = 0;
  let chunkNumber = 0;

  for (let i = 0; i < elements.length; i += chunkSize) {
    if (saveCancelled) {
      logInfo('⚠️ Operation cancelled by user');
      break;
    }

    chunkNumber++;
    const chunk = elements.slice(i, i + chunkSize);
    const chunkStartTime = Date.now();

    logInfo(`\n📦 Chunk ${chunkNumber}/${totalChunks} - Processing ${chunk.length} elements...`);

    chunk.forEach((e, index) => {
      if (saveCancelled) return;
      processedCount++;
      const progress = ((processedCount / totalElements) * 100).toFixed(1);
      logInfo(`  ✓ [${processedCount}/${totalElements}] (${progress}%) - Clicking element ${i + index + 1}`);
      e.style.border = '2px solid #ffeb3b';
      e.click();
    });

    const chunkElapsed = Date.now() - chunkStartTime;
    const elapsed = Date.now() - startTime;
    const avgTimePerElement = elapsed / processedCount;
    const remaining = totalElements - processedCount;
    const estimatedRemaining = Math.ceil((remaining * avgTimePerElement + (totalChunks - chunkNumber) * delay) / 1000);

    callbacks?.onProgress?.(processedCount, totalElements, chunkNumber, totalChunks, elapsed, estimatedRemaining);

    logInfo(`  ✅ Chunk ${chunkNumber} completed in ${chunkElapsed}ms`);
    logInfo(
      `  📈 Progress: ${processedCount}/${totalElements} (${((processedCount / totalElements) * 100).toFixed(1)}%)`,
    );
    logInfo(`  ⏱️  Elapsed: ${(elapsed / 1000).toFixed(1)}s | Est. remaining: ~${estimatedRemaining}s`);

    if (i + chunkSize < elements.length && !saveCancelled) {
      logInfo(`  ⏳ Waiting ${delay}ms before next chunk...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  const totalTime = Date.now() - startTime;
  logInfo('\n=== MASS SAVE MESSAGES - COMPLETE ===');
  logInfo(`📊 Final Stats:`, {
    totalProcessed: processedCount,
    totalChunks,
    totalTime: `${(totalTime / 1000).toFixed(2)}s`,
    avgTimePerElement: processedCount > 0 ? `${(totalTime / processedCount).toFixed(0)}ms` : '0ms',
    endTime: new Date().toLocaleTimeString(),
  });

  callbacks?.onComplete?.(processedCount, totalTime);
}

export function cancelSave() {
  saveCancelled = true;
}

export async function unsave(callbacks?: SaveProgressCallbacks) {
  const startTime = Date.now();
  const elements: HTMLDivElement[] = Array.from(
    document.querySelectorAll('.MibAa > li .gHTq4 .p8r1z:has(> :is(span, audio))'),
  );
  const totalElements = elements.length;
  const totalChunks = Math.ceil(totalElements / chunkSize);
  unsaveCancelled = false;

  logInfo('=== MASS UNSAVE MESSAGES - START ===');
  logInfo(`📊 Stats:`, {
    totalElements,
    chunkSize,
    totalChunks,
    estimatedTime: `${Math.ceil(((totalChunks - 1) * delay) / 1000)}s`,
    startTime: new Date(startTime).toLocaleTimeString(),
  });

  callbacks?.onStart?.(totalElements, totalChunks);

  if (totalElements === 0) {
    logInfo('⚠️ No elements found to unsave. Done.');
    return;
  }

  let processedCount = 0;
  let chunkNumber = 0;

  for (let i = 0; i < elements.length; i += chunkSize) {
    if (unsaveCancelled) {
      logInfo('⚠️ Operation cancelled by user');
      break;
    }

    chunkNumber++;
    const chunk = elements.slice(i, i + chunkSize);
    const chunkStartTime = Date.now();

    logInfo(`\n📦 Chunk ${chunkNumber}/${totalChunks} - Processing ${chunk.length} elements...`);

    chunk.forEach((e, index) => {
      if (unsaveCancelled) return;
      processedCount++;
      const progress = ((processedCount / totalElements) * 100).toFixed(1);
      logInfo(`  ✓ [${processedCount}/${totalElements}] (${progress}%) - Clicking element ${i + index + 1}`);
      e.style.border = '2px solid #ffeb3b';
      e.click();
    });

    const chunkElapsed = Date.now() - chunkStartTime;
    const elapsed = Date.now() - startTime;
    const avgTimePerElement = elapsed / processedCount;
    const remaining = totalElements - processedCount;
    const estimatedRemaining = Math.ceil((remaining * avgTimePerElement + (totalChunks - chunkNumber) * delay) / 1000);

    callbacks?.onProgress?.(processedCount, totalElements, chunkNumber, totalChunks, elapsed, estimatedRemaining);

    logInfo(`  ✅ Chunk ${chunkNumber} completed in ${chunkElapsed}ms`);
    logInfo(
      `  📈 Progress: ${processedCount}/${totalElements} (${((processedCount / totalElements) * 100).toFixed(1)}%)`,
    );
    logInfo(`  ⏱️  Elapsed: ${(elapsed / 1000).toFixed(1)}s | Est. remaining: ~${estimatedRemaining}s`);

    if (i + chunkSize < elements.length && !unsaveCancelled) {
      logInfo(`  ⏳ Waiting ${delay}ms before next chunk...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  const totalTime = Date.now() - startTime;
  logInfo('\n=== MASS UNSAVE MESSAGES - COMPLETE ===');
  logInfo(`📊 Final Stats:`, {
    totalProcessed: processedCount,
    totalChunks,
    totalTime: `${(totalTime / 1000).toFixed(2)}s`,
    avgTimePerElement: processedCount > 0 ? `${(totalTime / processedCount).toFixed(0)}ms` : '0ms',
    endTime: new Date().toLocaleTimeString(),
  });

  callbacks?.onComplete?.(processedCount, totalTime);
}

export function cancelUnsave() {
  unsaveCancelled = true;
}
