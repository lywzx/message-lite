import { Slave } from 'message-lite';
import { AlertService } from '@example/first-children-decl';
import { AlertServiceImpl } from '../core/impl/alert.service.impl';

export const slave = new Slave({
  createSender() {
    return (message: any) => window.parent!.postMessage(message, '*', []);
  },
  listenMessage(fn) {
    window.addEventListener('message', fn, false);
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
