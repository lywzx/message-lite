import { IEventer } from '../interfaces';
import { Event } from './event';

export class ServiceEventer<T = any> implements IEventer {
  protected event: Event;

  constructor(protected readonly eventName: string) {
    this.event = new Event();
  }
  emit(data: T): void {
    this.event.emit(this.eventName, data);
  }

  off(fn?: (data: T) => any): void {
    this.event.off(this.eventName, fn);
  }

  on(fn: (data: T) => any): void {
    this.event.on(this.eventName, fn);
  }

  once(fn: (data: T) => any): void {
    this.event.once(this.eventName, fn);
  }
}
