import { Class } from '../types';
import { getApiDeclInfo, IApiDeclFullApi } from './api-decl';
import {
  EMessageType,
  IAddService,
  IConnectSession,
  IEventerConstructor,
  IMessageCallData,
  IMessageContext,
  IMessageEvent,
} from '../interfaces';
import { MBaseService } from '../service';
import { createMessageEventName } from './message-helper';
import { throwException } from './exception';
import { createDefer } from './createDefer';

/**
 * 获取调用服务
 * @param messageContext
 * @param session
 * @param serv
 * @param eventer
 */
export function createSlaveService<T extends MBaseService>(
  messageContext: IMessageContext,
  session: IConnectSession,
  serv: Class<T>,
  eventer: IEventerConstructor<any>
) {
  const s = new serv();
  const impl = getApiDeclInfo(serv);
  const { name: serviceName } = impl;
  // 处理所有的API
  impl.apis.forEach((api) => {
    const method = api.method;
    (s as any)[method] = function (data: any, config: any = {}) {
      const option: IApiDeclFullApi = {
        ...api,
        ...config,
      };
      const callData = {
        type: EMessageType.CALL,
        service: serviceName,
        method,
        data,
      };
      const message = session.sendMessage(callData) as IMessageCallData;
      if (option.notify) {
        return Promise.resolve();
      } else {
        return session.waitMessageResponse(message, {
          timeout: option.timeout,
        });
      }
    };
  });
  // 处理所有的事件
  impl.events.forEach((evt) => {
    const evtName = evt.name;
    const opt = {
      service: serviceName,
      event: evtName,
    };
    const eventName = createMessageEventName(opt, false);
    const evter = ((s as any)[evtName] = new eventer({
      eventName,
      whenListened() {
        messageContext.on(eventName, (...args: any[]) => {
          evter.emit(args[0]);
        });
        session.sendMessage<Omit<IMessageEvent, 'id'>>({
          type: EMessageType.EVENT_ON,
          ...opt,
        });
      },
      whenUnListened() {
        session.sendMessage<Omit<IMessageEvent, 'id'>>({
          type: EMessageType.EVENT_OFF,
          ...opt,
        });
      },
    }));
  });
  return s;
}

/**
 * 创建master服务的service
 * @param messageContext
 * @param serv
 */
export function createMasterService<T extends MBaseService>(
  messageContext: IMessageContext,
  serv: Class<T>
  // eventer: IEventerConstructor<any>
): T {
  const s = new serv();
  const impl = getApiDeclInfo(serv);

  // 处理所有的API
  impl.apis.forEach((api) => {
    (s as any)[api.method] = () => {
      throwException('master api method not support called!');
    };
  });

  // 处理事件
  impl.events.forEach((evt) => {
    const evtName = evt.name;
    (s as any)[evtName] = {
      emit(data: any) {
        messageContext.broadcast({
          service: impl.name,
          event: evtName,
          data,
        });
      },
    };
  });

  return s;
}

/**
 * add service to message context
 * @param services
 * @param messageContext
 */
export function addServices(services: Array<IAddService<any, any>>, messageContext: IMessageContext) {
  services.forEach((it) => {
    const { impl, decl } = it;
    const info = getApiDeclInfo(decl);
    const apiInstance = new impl();
    info.apis.forEach((api) => {
      const eventName = createMessageEventName({
        type: EMessageType.CALL,
        service: info.name,
        method: api.method,
      });
      messageContext.on(eventName, async (data: IMessageCallData, option: { timeout?: number }) => {
        const session = messageContext.getSession(data.channel)!;

        try {
          const df = createDefer(option?.timeout);
          const result = await Promise.race([apiInstance[api.method](data.data, session), df.promise]);

          if (!api.notify) {
            session.sendMessage({
              fromId: data.id,
              id: data.id,
              type: EMessageType.RESPONSE,
              data: result,
            });
          }
        } catch (e) {
          if (!api.notify) {
            const err = e as Error;
            session.sendMessage({
              fromId: data.id,
              id: data.id,
              type: EMessageType.RESPONSE_EXCEPTION,
              data: err.stack || err.message,
            });
          } else {
            throw e;
          }
        }
      });
    });
  });
}
