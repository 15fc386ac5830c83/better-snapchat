import Patch from '../lib/patch';
import settings from '../lib/settings';
import { logRawEvent } from '../lib/debug';

class CrossTabBroadcastChannel extends Patch {
  constructor() {
    super('Cross-Tab Broadcast Channel');
  }

  patch() {
    window.BroadcastChannel = class PatchedBroadcastChannel extends window.BroadcastChannel {
      addEventListener(type: string, listener: EventListener) {
        return super.addEventListener(type, ((event: MessageEvent) => {
          logRawEvent('BroadcastChannel.message', { channelName: this.name, type, data: event.data });

          if (
            this.name === 'cross_tab' &&
            settings.getSetting('ALLOW_CROSS_TAB') &&
            event.data.type === 'CLAIM_ACTIVE'
          ) {
            return;
          }

          listener(event);
        }) as EventListener);
      }
    };
  }
}

export default new CrossTabBroadcastChannel();
