import { IEvent, IEventer, IEventerUnListener } from '../interfaces';
import { throwException } from './exception';
import { EventOff, EventOn } from '../constant';

export interface ICreateSlaveEventOption {
  eventName: string;
  eventer: IEvent<any>;
  whenListened: () => void;
  whenUnListened: () => void;
  whenEmitData: (data: { eventName: string; data: any }) => void;
}

/**
 * 创建slave event
 * @param option
 */
export function createSlaveEvent<T = any>(
  option: ICreateSlaveEventOption
): {
  senderDataToInternal(data: T): void;
  eventer: IEventer<T>;
} {
  const { eventer, eventName } = option;
  const bindEventName = `${eventName}:bind:event:key`;
  let addListenerCount = 0;

  eventer.on(EventOn as any, (evtName) => {
    if (evtName === bindEventName) {
      addListenerCount++;

      if (addListenerCount > 0) {
        option.whenListened();
      }
    }
  });

  eventer.on(EventOff as any, (evtName) => {
    if (evtName === bindEventName) {
      addListenerCount--;

      if (addListenerCount <= 0) {
        option.whenUnListened();
      }
    }
  });

  return {
    senderDataToInternal(data) {
      eventer.emit(bindEventName, data);
    },
    eventer: {
      on(fn: <T>(data: T) => any): IEventerUnListener {
        eventer.on(bindEventName, fn);
        return () => {
          eventer.off(bindEventName, fn);
        };
      },
      once(fn: <T>(data: T) => any): IEventerUnListener {
        eventer.on(bindEventName, fn, true);
        return () => {
          eventer.off(bindEventName, fn, true);
        };
      },
      emit(data: T) {
        option.whenEmitData({
          data,
          eventName: eventName,
        });
      },
    } as IEventer<T>,
  };
}

export interface ICreateMasterEventOption {
  eventName: string;
  whenEmitData: (data: { eventName: string; data: any }) => void;
}

export function createMasterEvent<T = any>(option: ICreateMasterEventOption): IEventer<T> {
  return {
    on(fn: <T>(data: T) => any): IEventerUnListener {
      return throwException('not support listen');
    },
    once(fn: <T>(data: T) => any): IEventerUnListener {
      return throwException('not support listen');
    },
    emit(data: T) {
      option.whenEmitData({
        data,
        eventName: option.eventName,
      });
    },
  } as IEventer<T>;
}
