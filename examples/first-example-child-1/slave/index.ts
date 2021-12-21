import { Slave } from 'message-lite';

export const slave = new Slave({
  sendMessage(message: any) {
    window.parent!.postMessage(message, '*', []);
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
});
