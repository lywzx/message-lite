import { EMessageType, IMessageCallData, IServerConfigBase } from '../interfaces';
import { Class } from '../types';
import { MessageContext } from './message-context';
import { defer, getApiDeclInfo } from '../util';
import { BaseService } from './base-service';

export interface IAddService<T extends BaseService, U extends T> {
  impl: Class<U>;
  decl: Class<T>;
}

export abstract class BasicServer {
  protected messageContext: MessageContext;

  constructor(option: IServerConfigBase) {
    this.messageContext = new MessageContext(option);
  }

  /**
   * 获取某个服务
   */
  abstract getService<T>(serv: Class<T>): T | undefined;

  /**
   * 添加服务
   */
  addService(services: Array<IAddService<any, any>>) {
    const messageContext = this.messageContext;
    services.forEach((it) => {
      const { impl, decl } = it;
      const info = getApiDeclInfo(decl);
      const apiInstance = new impl();
      info.apis.forEach((api) => {
        messageContext.on(
          `${info.name}:${api.method}:call`,
          async (data: IMessageCallData, option: { timeout?: number }) => {
            const session = messageContext.getSession(data.channel)!;

            try {
              const df = defer(option?.timeout);
              const result = await Promise.race([apiInstance[api.method](data.data, session), df.promise]);

              session.sendMessage({
                id: data.id,
                type: EMessageType.RESPONSE,
                data: result,
              });
            } catch (e) {
              const err = e as Error;
              session.sendMessage({
                id: data.id,
                type: EMessageType.RESPONSE_EXCEPTION,
                data: err.stack || err.message,
              });
            }
          }
        );
      });
    });
  }
}
