import { IAddService, IConnectSession, IMessageConfig, IMessageContext } from '../interfaces';
import { Class } from '../types';
import { MessageContext, WILL_DISCOUNT } from './message-context';
import { addServices } from '../util';
import { EventEmitter } from './event-emitter';
import { ESessionStateClosingWaitingSecondApprove } from '../constant';
import { ConnectServiceImpl, ConnectService } from '../service';

export abstract class BasicServer extends EventEmitter {
  protected messageContext: IMessageContext;

  protected started = false;

  protected constructor(option: IMessageConfig) {
    super();
    const messageContext = (this.messageContext = new MessageContext(option));
    messageContext.on(WILL_DISCOUNT, this.whenClientWillDisConnected);
    this.addService([
      {
        impl: ConnectServiceImpl,
        decl: ConnectService,
      },
    ]);
  }

  /**
   * 处理断开连接逻辑
   * @param message
   * @param session
   */
  private whenClientWillDisConnected = async (message: any, session: IConnectSession) => {
    (session as any).state = ESessionStateClosingWaitingSecondApprove;

    await session.disconnect();
  };

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
