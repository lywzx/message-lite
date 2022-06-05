import { IEventer, IServiceEventerOption } from '../interfaces';
import { Event, EventOff, EventOn } from './event';
import { throwException } from '../util';

export const ServiceEventerInnerEmit = Symbol('service-eventer-inner-emit');

export class ServiceEventer<T = any> implements IEventer<T> {
  protected event: Event;

  protected listened = 0;

  public [ServiceEventerInnerEmit] = (...args: any[]) => {
    this.event.emit(this.option.eventName, ...args);
  };

  constructor(protected readonly option: IServiceEventerOption) {
    const { eventName } = option;
    const event = (this.event = new Event());
    if (!eventName) {
      throwException('event name can not be empty!');
    }
    event.on(EventOn, this.whenEventOn);
    event.on(EventOff, this.whenEventOff);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected whenEventOn = (evtName: string, callback?: Function) => {
    const { eventName, whenListened } = this.option;
    if (eventName === evtName && whenListened) {
      this.listened++;
      if (this.listened > 0) {
        whenListened();
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected whenEventOff = (evtName: string, callback?: Function) => {
    const { eventName, whenUnListened } = this.option;
    if (eventName === evtName && whenUnListened) {
      this.listened--;
      if (!this.listened) {
        whenUnListened();
      }
    }
  };

  emit(data: T): void {
    if (this.listened) {
      this.event.emit(this.option.eventName, data);
    }
  }

  on(fn: (data: T) => any) {
    const { event, option } = this;
    const eventName = option.eventName;
    event.on(eventName, fn);
    return () => {
      event.off(eventName, fn);
    };
  }

  once(fn: (data: T) => any) {
    const { event, option } = this;
    const eventName = option.eventName;
    event.once(eventName, fn);
    return () => {
      event.off(eventName, fn);
    };
  }

  dispose() {
    // todo 需要确认一下，是否有必要调用whenUnListened方法
    this.listened = 0;
    this.event.dispose();
  }
}
