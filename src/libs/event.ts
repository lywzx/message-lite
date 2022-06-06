import { IEvent, IEventCallback } from '../interfaces';

/**
 * when event listen
 */
export const EventOn = Symbol('when-event-on');
/**
 * when event off listen
 */
export const EventOff = Symbol('when-event-off');
/**
 * when event all off
 */
export const EventOffAll = Symbol('when-event-off-all');

const eventOnOrOffSet = new Set([EventOff, EventOn]);
const isExcludeEvent = (event: string | symbol) => eventOnOrOffSet.has(event as unknown as any);

export class Event implements IEvent {
  protected eventer: Map<string | symbol, Array<{ callback: IEventCallback; once: boolean }>> = new Map();

  on(event: string | symbol, fn: (...args: any[]) => any, once = false) {
    const { eventer } = this;
    const callbacks = eventer.get(event) || [];
    if (!callbacks.find((it) => it.callback === fn && it.once === once)) {
      callbacks.push({
        callback: fn,
        once,
      });
      if (!isExcludeEvent(event)) {
        this.emit(EventOn, event, fn);
      }
    }
    eventer.set(event, callbacks);
  }

  off(event: string | symbol, fn?: IEventCallback, once?: boolean) {
    const { eventer } = this;
    if (eventer.has(event)) {
      const callbacks = eventer.get(event)!;
      const isBoolean = typeof once === 'boolean';
      const filterCallbacks = fn
        ? callbacks.filter((item) => {
            const notSameCallback = item.callback === fn;
            if (isBoolean) {
              return !(notSameCallback && item.once === once);
            }
            return !notSameCallback;
          })
        : [];
      const excludeEvent = isExcludeEvent(event);
      if (!fn || !filterCallbacks.length) {
        eventer.delete(event);
        if (!excludeEvent) {
          this.emit(EventOffAll, event, fn);
        }
      } else {
        eventer.set(event, filterCallbacks);
      }
      if (filterCallbacks.length !== callbacks.length) {
        Array.from({ length: callbacks.length - filterCallbacks.length }).forEach(() => {
          this.emit(EventOff, event, fn);
        });
      }
    }
  }

  once(event: string | symbol, fn: IEventCallback) {
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
          this.off(event, callback, once);
        }
      }
    });
  }

  public dispose() {
    this.eventer = new Map();
  }
}
