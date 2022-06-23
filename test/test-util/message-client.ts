import { EventEmitter } from '../../src/libs';
import { IEvent } from '../../src/interfaces';
import { Master, SimpleMix, Slave } from '../../src';

export const GLOBAL_EVENT_NAME = 'global:event';
export const GLOBAL_SLAVE_EVENT_NAME = 'global:slave:event';

/**
 * create serve
 */
export function createServe() {
  const globalEvent = new EventEmitter();

  const master = new Master({
    listenMessage(fn: (message: any) => void): void {
      globalEvent.on(GLOBAL_EVENT_NAME, fn);
    },
    transformMessage(message: any): any {
      return message.data;
    },
    unListenMessage(fn: (message: any) => void): void {
      globalEvent.off(GLOBAL_EVENT_NAME, fn);
    },
    createSender(origin?: any): (message: any) => void {
      return function (p1: any) {
        return origin!.source.emit(GLOBAL_SLAVE_EVENT_NAME, p1);
      };
    },
  });

  return {
    master,
    globalEvent,
  };
}

/**
 * create slave client
 * @param globalEvent
 */
export function createClient(globalEvent: IEvent) {
  const currentEvent = new EventEmitter();
  return new Slave({
    listenMessage(fn: (message: any) => void): void {
      currentEvent.on(GLOBAL_SLAVE_EVENT_NAME, fn);
    },
    unListenMessage(fn: (message: any) => void): void {
      currentEvent.off(GLOBAL_SLAVE_EVENT_NAME, fn);
    },
    createSender(origin?: any): (message: any) => void {
      return function (p1: any) {
        globalEvent.emit(GLOBAL_EVENT_NAME, {
          data: p1,
          source: currentEvent,
        });
      };
    },
  });
}

/**
 * create simple mix client
 */
export function createSimpleMixClient() {
  const clientName = 'app-client-name';
  const globalEvent = new EventEmitter();
  const eventNames = ['page-master:event', 'page-slave:event'];
  const mClient = new SimpleMix({
    name: clientName,
    listenMessage(fn: (message: any) => void): void {
      globalEvent.on(eventNames[0], fn);
    },
    unListenMessage(fn: (message: any) => void): void {
      globalEvent.off(eventNames[0], fn);
    },
    createSender(origin?: any): (message: any) => void {
      return function (p1: any) {
        globalEvent.emit(eventNames[1], p1);
      };
    },
  });
  const sClient = new SimpleMix({
    name: clientName,
    listenMessage(fn: (message: any) => void): void {
      globalEvent.on(eventNames[1], fn);
    },
    unListenMessage(fn: (message: any) => void): void {
      globalEvent.off(eventNames[1], fn);
    },
    createSender(origin?: any): (message: any) => void {
      return function (p1: any) {
        globalEvent.emit(eventNames[0], p1);
      };
    },
  });

  return {
    mClient,
    sClient,
  };
}
