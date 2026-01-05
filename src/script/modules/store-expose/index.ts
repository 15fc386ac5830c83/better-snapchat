import Module from '../../lib/module';
import { getSnapchatStore } from '../../utils/snapchat';

class StoreExpose extends Module {
  private retryInterval: number | null = null;

  constructor() {
    super('StoreExpose');
  }

  load() {
    const store = getSnapchatStore();
    if (store != null) {
      // @ts-ignore
      window.snapchatStore = store;
      if (this.retryInterval != null) {
        clearInterval(this.retryInterval);
        this.retryInterval = null;
      }
    } else {
      // Retry every 100ms until the store is available
      if (this.retryInterval == null) {
        this.retryInterval = window.setInterval(() => {
          const store = getSnapchatStore();
          if (store != null) {
            // @ts-ignore
            window.snapchatStore = store;
            if (this.retryInterval != null) {
              clearInterval(this.retryInterval);
              this.retryInterval = null;
            }
          }
        }, 100);
      }
    }
  }
}

export default new StoreExpose();
