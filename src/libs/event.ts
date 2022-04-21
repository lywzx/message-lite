import { IEvent } from '../interfaces';

export const EventOn = Symbol('when-event-on');
export const EventOff = Symbol('when-event-off');
export const EventOffAll = Symbol('when-event-off-all');

const isExcludeEvent = (event: string | symbol) => [EventOn, EventOff].includes(event as unknown as any);

export class Event implements IEvent {
  protected eventer: Map<string | symbol, Array<{ callback: (...args: any[]) => any; once: boolean }>> = new Map();

  on(event: string | symbol, fn: (...args: any[]) => any, once = false) {
    const callbacks = this.eventer.get(event) || [];
    if (!callbacks.find((it) => it.callback === fn && it.once === once)) {
      callbacks.push({
        callback: fn,
        once,
      });
      if (!isExcludeEvent(event)) {
        this.emit(EventOn, event, fn);
      }
    }
    this.eventer.set(event, callbacks);
  }

  off(event: string | symbol, fn?: (...args: any[]) => any, once = false) {
    if (this.eventer.has(event)) {
      const callbacks = this.eventer.get(event)!;
      const filterCallbacks = fn ? callbacks.filter((item) => item.callback !== fn && item.once !== once) : [];
      const excludeEvent = isExcludeEvent(event);
      if (!fn || !filterCallbacks.length) {
        this.eventer.delete(event);
        if (!excludeEvent) {
          this.emit(EventOffAll, event, fn);
        }
      } else {
        this.eventer.set(event, filterCallbacks);
      }
      if (filterCallbacks.length !== callbacks.length) {
        Array.from({ length: callbacks.length - filterCallbacks.length }).forEach(() => {
          this.emit(EventOff, event, fn);
        });
      }
    }
  }

  once(event: string | symbol, fn: (...args: any[]) => any) {
    this.on(event, fn, true);
  }

  emit(event: string | symbol, ...args: any[]) {
    const callback = this.eventer.get(event) || [];
    callback.forEach((option) => {
      const { once, callback } = option;
      try {
        callback(...args);
      } finally {
        if (once) {
          this.off(event, callback);
        }
      }
    });
  }

  public dispose() {
    this.eventer = new Map();
  }
}
