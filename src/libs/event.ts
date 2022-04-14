import { IEvent } from '../interfaces';

export class Event implements IEvent {
  protected eventer: Map<string, Array<(...args: any[]) => any>> = new Map();

  on(event: string, fn: (...args: any[]) => any) {
    const callbacks: Array<(...args: any[]) => any> = this.eventer.get(event) || [];
    if (!callbacks.includes(fn)) {
      callbacks.push(fn);
    }
    this.eventer.set(event, callbacks);
  }

  off(event: string, fn?: (...args: any[]) => any) {
    if (this.eventer.has(event)) {
      let callbacks = this.eventer.get(event)!;
      if (fn) {
        callbacks = callbacks.filter((item) => item !== fn);
      }
      if (!fn || !callbacks.length) {
        this.eventer.delete(event);
      } else {
        this.eventer.set(event, callbacks);
      }
    }
  }

  once(event: string, fn: (...args: any[]) => any) {
    this.on(event, fn);
    this.on(event, () => {
      this.off(event, fn);
    });
  }

  emit(event: string, ...args: any[]) {
    const callback = this.eventer.get(event) || [];
    callback.forEach((fn) => {
      try {
        fn(...args);
      } finally {
      }
    });
  }

  public dispose() {
    this.eventer = new Map<string, Array<(...args: any[]) => any>>();
  }
}
