import { Master } from 'message-lite';

export const master = new Master({
  createMasterSender(event: MessageEvent) {
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

master.start();
