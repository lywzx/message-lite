import { BaseConnectSession, BaseService, MessageContext, ServiceEventer } from '../libs';
import { Class } from '../types';
import { getApiDeclInfo, IApiDeclFullApi } from './api-decl';
import { EMessageType, IMessageCallData } from '../interfaces';

/**
 * 获取调用服务
 * @param messageContext
 * @param session
 * @param serv
 */
export function createSlaveService<T extends BaseService>(
  messageContext: MessageContext,
  session: BaseConnectSession,
  serv: Class<T>
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
        return messageContext.waitMessageResponse(message, {
          timeout: option.timeout || 30000,
        });
      }
    };
  });
  // 处理所有的事件
  impl.events.forEach((evt) => {
    const eventer = new ServiceEventer(`${impl.name}:${evt.name}`);
    (s as any)[evt.name] = eventer;
  });
  return s;
}
