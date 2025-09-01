import { IMessageTransport } from './interfaces';

export interface WindowMessageTransportOptions {
  targetOrigin?: string;
  isParent?: boolean;
  targetWindow?: Window;
}

/**
 * 基于window.postMessage的消息传输实现
 */
export class WindowMessageTransport implements IMessageTransport {
  private targetOrigin: string;
  private isParent: boolean;
  private targetWindow?: Window;

  constructor(options: WindowMessageTransportOptions = {}) {
    this.targetOrigin = options.targetOrigin || '*';
    this.isParent = options.isParent ?? false;
    this.targetWindow = options.targetWindow;
  }

  createSender(origin?: any) {
    return (message: any) => {
      let target: Window | null = null;
      
      if (this.targetWindow) {
        target = this.targetWindow;
      } else if (this.isParent) {
        // 如果是父窗口，需要从origin获取目标窗口
        if (origin && origin.source) {
          target = origin.source;
        }
      } else {
        // 如果是子窗口，向父窗口发送
        target = window.parent;
      }
      
      if (target && target.postMessage) {
        target.postMessage(message, this.targetOrigin);
      } else {
        console.warn('Unable to send message: no target window available');
      }
    };
  }

  listenMessage(fn: (message: any) => void): void {
    const listener = (event: MessageEvent) => {
      // 可以在这里添加安全检查
      if (this.targetOrigin !== '*' && event.origin !== this.targetOrigin) {
        return;
      }
      fn(event);
    };
    
    window.addEventListener('message', listener, false);
    // 将原始函数和包装函数关联起来，以便正确移除监听器
    (fn as any)._wrappedListener = listener;
  }

  unListenMessage(fn: (message: any) => void): void {
    const wrappedListener = (fn as any)._wrappedListener;
    if (wrappedListener) {
      window.removeEventListener('message', wrappedListener, false);
      delete (fn as any)._wrappedListener;
    }
  }

  transformMessage(message: MessageEvent): any {
    return message.data;
  }
}