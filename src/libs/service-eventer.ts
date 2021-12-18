import { IEventer } from '../interfaces';
import { Event } from './event';

export class ServiceEventer<T = any> implements IEventer {
  protected event: Event;

  constructor(protected readonly eventName: string) {
    this.event = new Event();
    if (!eventName) {
      throw new Error('event name can not be empty!');
    }
  }
  emit(data: T): void {
    this.event.emit(this.eventName, data);
  }

  on(fn: (data: T) => any) {
    this.event.on(this.eventName, fn);
    return () => {
      this.event.off(this.eventName, fn);
    };
  }

  once(fn: (data: T) => any) {
    this.event.once(this.eventName, fn);
    return () => {
      this.event.off(this.eventName, fn);
    };
  }

  dispose() {
    this.event.dispose();
  }
}
