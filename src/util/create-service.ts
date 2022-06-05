import { Class } from '../types';
import { getApiDeclInfo, IApiDeclFullApi } from './api-decl';
import {
  EMessageType,
  IConnectSession,
  IEventerConstructor,
  IMessageCallData,
  IMessageContext,
  IMessageEvent,
} from '../interfaces';
import { MBaseService } from '../service';
import { createMessageEventName } from './message-helper';
import { throwException } from './exception';

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
  // 处理所有的API
  impl.apis.forEach((api) => {
    (s as any)[api.method] = function (data: any, config: any = {}) {
      const option: IApiDeclFullApi = {
        ...api,
        ...config,
      };
      const callData = {
        type: EMessageType.CALL,
        service: impl.name,
        method: api.method,
        data,
      };
      const message = session.sendMessage(callData) as IMessageCallData;
      if (option.notify) {
        return Promise.resolve();
      } else {
        return session.waitMessageResponse(message, {
          timeout: option.timeout || 30000,
        });
      }
    };
  });
  // 处理所有的事件
  impl.events.forEach((evt) => {
    const opt = {
      service: impl.name,
      event: evt.name,
    };
    const eventName = createMessageEventName(opt, false);
    const evter = ((s as any)[evt.name] = new eventer({
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
    (s as any)[evt.name] = {
      emit(data: any) {
        messageContext.broadcast({
          service: impl.name,
          event: evt.name,
          data,
        });
      },
    };
  });

  return s;
}
