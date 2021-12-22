import { IMasterServerConfig } from './interfaces';
import { Class } from './types';
import { BaseConnectSession, BasicServer, MessageContext, WILL_CONNECT, WILL_DISCOUNT } from './libs';

export interface IOpeningOption {
  clientId: string;
  timeout?: number;
}

export class Master extends BasicServer {
  protected sessionMap = new Map<string, BaseConnectSession>();

  protected clientIndex = 1000;

  constructor(protected readonly option: IMasterServerConfig) {
    super(option);
  }

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
}
