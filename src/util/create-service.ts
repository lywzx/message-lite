import { Class } from '../types';
import { getApiDeclInfo, IApiDeclFullApi } from './api-decl';
import { EMessageType, IConnectSession, IEventer, IMessageCallData, IMessageContext } from '../interfaces';
import { MBaseService } from '../service';

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
  eventer: Class<IEventer>
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
    (s as any)[evt.name] = new eventer(`${impl.name}:${evt.name}`);
  });
  return s;
}
