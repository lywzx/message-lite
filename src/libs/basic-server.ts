import { IAddService, IMessageConfig } from '../interfaces';
import { Class } from '../types';
import { MessageContext } from './message-context';
import { addServices } from '../util';
import { Event } from './event';

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
    addServices(services, this.messageContext);
    return this;
  }
}
