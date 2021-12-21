import { EMessageType, IMessageCallData, IMasterServerConfig } from './interfaces';
import { Class } from './types';
import { getApiDeclInfo, defer } from './util';
import { BaseConnectSession, BaseService, MessageContext, WILL_CONNECT, WILL_DISCOUNT } from './libs';

export interface IOpeningOption {
  clientId: string;
  timeout?: number;
}

export interface IAddService<T extends BaseService, U extends T> {
  impl: Class<U>;
  decl: Class<T>;
}

export class Master {
  protected sessionMap = new Map<string, BaseConnectSession>();

  protected messageContext!: MessageContext;

  protected clientIndex = 1000;

  constructor(protected readonly option: IMasterServerConfig) {}

  getService<T>(serv: Class<T>): T | undefined {
    throw new Error('api not available!');
  }

  protected whenNewClientConnected = (message: any) => {};

  protected whenClientWillDisConnected = (message: any) => {};

  async start(): Promise<void> {
    const messageContext = new MessageContext(this.option);
    messageContext.start();
    messageContext.on(WILL_CONNECT, this.whenNewClientConnected);
    messageContext.on(WILL_DISCOUNT, this.whenClientWillDisConnected);
    this.messageContext = messageContext;
  }

  async stop(): Promise<void> {
    this.messageContext.dispose();
  }
  /**
   * 打开端口等待连接
   */
  /*  async opening(option: IOpeningOption): Promise<void> {
    this.messageContext.start();
    const res = (await this.messageContext.whenServiceCalled(ConnectService, {
      method: 'connect',
      timeout: option.timeout,
    })) as IMessageCallData;
    const assignClientIndex = ++this.clientIndex;
    const channelId = `${option.clientId}:${assignClientIndex}`;
    await this.messageContext.sendMessageWithOutResponse({
      id: res.id,
      type: EMessageType.RESPONSE,
      data: channelId,
    });
    this.messageContext.setChannel(channelId);
    this.messageContext.readied();
  }*/
  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    this.messageContext.dispose();
  }
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
            try {
              const df = defer(option?.timeout);
              const result = await Promise.race([apiInstance[api.method](data.data), df.promise]);
              await messageContext.sendMessageWithOutResponse({
                id: data.id,
                type: EMessageType.RESPONSE,
                data: result,
              });
            } catch (e) {
              const err = e as Error;
              await messageContext.sendMessageWithOutResponse({
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
