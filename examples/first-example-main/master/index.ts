import { Master } from 'message-lite';
import { ALL_SERVICE } from '../core/impl';

export const master = new Master({
  createSender(event: MessageEvent) {
    return (message: any) => {
      (event.source as WindowProxy)!.postMessage(message, '*', []);
    };
  },
  listenMessage(fn) {
    window.addEventListener(
      'message',
      (...args) => {
        console.log('1111111-master', args[0], args[0].data);
        fn(...args);
      },
      false
    );
  },
  unListenMessage(fn) {
    window.removeEventListener('message', fn, false);
  },
  transformMessage(event: MessageEvent) {
    return event.data;
  },
});
master.addService(ALL_SERVICE).start();
