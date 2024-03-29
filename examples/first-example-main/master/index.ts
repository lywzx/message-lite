import { Master } from 'message-lite';
import { ALL_SERVICE } from '../core/impl';

export const master = new Master({
  createSender(event: MessageEvent) {
    return (message: any) => {
      (event.source as WindowProxy)!.postMessage(message, '*', []);
    };
  },
  listenMessage(fn) {
    window.addEventListener('message', fn, false);
  },
  unListenMessage(fn) {
    window.removeEventListener('message', fn, false);
  },
  transformMessage(event: MessageEvent) {
    return event.data;
  },
});
master.addService(ALL_SERVICE).start();
