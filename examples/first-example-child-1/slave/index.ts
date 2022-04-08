import { Slave } from 'message-lite';

export const slave = new Slave({
  sendMessage(message: any) {
    window.parent!.postMessage(message, '*', []);
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
});
