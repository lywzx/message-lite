import { EMessageType, IMasterServerConfig, IMessageHandshakeData } from './interfaces';
import { Class } from './types';
import { BasicServer, ConnectSession, MessageContext, WILL_CONNECT, WILL_DISCOUNT } from './libs';
import { parsePort } from './util/session-port';
import { uniqId } from './util/random';
import { parseHandshakeMessage, sendHandshakeResponseMessage } from './util';

export interface IOpeningOption {
  clientId: string;
  timeout?: number;
}

export class Master extends BasicServer {
  protected sessionMap = new Map<string, ConnectSession>();

  protected clientIndex = 1000;

  constructor(protected readonly option: IMasterServerConfig) {
    super(option);
  }

  getService<T>(serv: Class<T>): T | undefined {
    throw new Error('api not available!');
  }

  protected whenNewClientConnected = (message: any) => {
    const option = this.option;
    const connectMessage = (
      option.transformMessage ? option.transformMessage(message) : message
    ) as IMessageHandshakeData;
    const { id, channel, data } = connectMessage;
    const parsedHandshake = parseHandshakeMessage(data);
    if (!parsedHandshake) {
      return;
    }
    const info = parsePort(channel);
    const session = new ConnectSession(info.name, this.option.createMasterSender(message));
    const port2 = uniqId();
    session.setPort2(port2);
    this.messageContext.attachSession(session);
    // 发送响应信息
    const response = session.sendMessageWithResponse({
      data: sendHandshakeResponseMessage(data),
      type: EMessageType.RESPONSE,
    });

    response.catch(() => {
      this.messageContext.detachSession(session);
    });
  };

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
