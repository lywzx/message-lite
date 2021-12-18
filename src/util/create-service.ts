import { BaseService, MessageContext, ServiceEventer } from '../libs';
import { Class } from '../types';
import { getApiDeclInfo, IApiDeclFullApi } from './api-decl';
import { EMessageType } from '../interfaces';

/**
 * 获取调用服务
 * @param message
 * @param serv
 */
export function createSlaveService<T extends BaseService>(message: MessageContext, serv: Class<T>) {
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
      if (option.notify) {
        return message.sendMessageWithOutResponse({
          ...callData,
          type: EMessageType.CALL,
        });
      } else {
        return message.sendMessageWithResponse(
          {
            ...callData,
            type: EMessageType.CALL,
          },
          {
            timeout: option.timeout,
          }
        );
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
