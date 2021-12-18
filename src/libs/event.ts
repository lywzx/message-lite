export class Event {
  protected eventer: Map<string, Array<(...args: any[]) => any>> = new Map();

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
        this.eventer.set(
          event,
          callbacks.filter((item) => item !== fn)
        );
      } else {
        this.eventer.delete(event);
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
