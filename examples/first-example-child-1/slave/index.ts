import { Slave } from 'message-lite';
import { AlertService } from '@example/first-children-decl';
import { AlertServiceImpl } from '../core/impl/alert.service.impl';

export const slave = new Slave({
  createSender() {
    return (message: any) => window.parent!.postMessage(message, '*', []);
  },
  listenMessage(fn) {
    window.addEventListener(
      'message',
      (...args) => {
        console.log('1111111-slave', args[0], args[0].data);
        fn(...args);
      },
      false
    );
  },
  unListenMessage(fn: (message: any) => void): void {
    window.removeEventListener('message', fn, false);
  },
  transformMessage(message: MessageEvent) {
    return message.data;
  },
}).addService([
  {
    decl: AlertService,
    impl: AlertServiceImpl,
  },
]);
