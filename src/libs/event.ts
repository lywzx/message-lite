export class Event {
  protected eventer: Map<string, Array<(...args: any[]) => any>> = new Map();

  protected onceEventer: Map<any, boolean> = new Map<any, boolean>();

  on(event: string, fn: (...args: any[]) => any) {
    const callbacks: Array<(...args: any[]) => any> = this.eventer.get(event) || [];
    if (!callbacks.includes(fn)) {
      callbacks.push(fn);
    }
    this.eventer.set(event, callbacks);
  }

  off(event: string, fn?: (...args: any[]) => any) {
    const callbacks = this.eventer.get(event);
    if (callbacks && callbacks.length) {
      if (fn) {
        const index = callbacks.indexOf(fn);
        callbacks.splice(index, 1);
        this.eventer.set(event, callbacks);
      } else {
        this.eventer.delete(event);
      }
    }
  }

  once(event: string, fn: (...args: any[]) => any) {
    this.onceEventer.set(fn, true);
    this.on(event, fn);
  }

  emit(event: string, ...args: any[]) {
    const callback = this.eventer.get(event) || [];
    callback.forEach((fn) => {
      try {
        fn(...args);
      } finally {
        if (this.onceEventer.has(fn)) {
          this.onceEventer.delete(fn);
        }
      }
    });
  }

  protected dispose() {
    this.eventer = new Map<string, Array<(...args: any[]) => any>>();
    this.onceEventer = new Map();
  }
}
