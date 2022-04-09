import { EMessageType, IMessageCallData, IMessageConfig } from '../interfaces';
import { Class } from '../types';
import { MessageContext } from './message-context';
import { createMessageEventName, defer, getApiDeclInfo } from '../util';
import { MBaseService } from '../service';
import { Event } from './event';

export interface IAddService<T extends MBaseService = any, U extends T = any> {
  impl: Class<U>;
  decl: Class<T>;
}

export abstract class BasicServer extends Event {
  protected messageContext: MessageContext;

  protected started = false;

  protected constructor(option: IMessageConfig) {
    super();
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
        const eventName = createMessageEventName({
          type: EMessageType.CALL,
          service: info.name,
          method: api.method,
        });
        messageContext.on(eventName, async (data: IMessageCallData, option: { timeout?: number }) => {
          const session = messageContext.getSession(data.channel)!;

          try {
            const df = defer(option?.timeout);
            const result = await Promise.race([apiInstance[api.method](data.data, session), df.promise]);

            session.sendMessage({
              fromId: data.id,
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
        });
      });
    });
    return this;
  }
}
