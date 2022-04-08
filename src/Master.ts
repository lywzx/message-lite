import { EMessageType, IMasterServerConfig, IMessageBaseData, IMessageHandshakeData } from './interfaces';
import { Class } from './types';
import { BasicServer, ConnectSession, MessageContext, WILL_CONNECT, WILL_DISCOUNT } from './libs';
import { parsePort } from './util/session-port';
import {
  checkReceiveIsMatchInitMessage,
  EHandshakeMessageType,
  parseHandshakeMessage,
  sendHandshakeResponseMessage
} from './util';

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

  protected whenNewClientConnected = async (message: any) => {
    const { option, messageContext } = this;
    const connectMessage = (
      option.transformMessage ? option.transformMessage(message) : message
    ) as IMessageHandshakeData;
    const { id, channel, data } = connectMessage;
    const parsedHandshake = parseHandshakeMessage(data);
    if (!parsedHandshake || parsedHandshake.type !== EHandshakeMessageType.INIT) {
      return;
    }
    const info = parsePort(channel);
    const handshakeResponseMessage = sendHandshakeResponseMessage(data);
    const handshakeResponseMessageObj = parseHandshakeMessage(handshakeResponseMessage);
    const session = new ConnectSession(info.name, this.option.createMasterSender(message));
    session.setPort1(handshakeResponseMessageObj!.offset);
    session.setPort2(info.port1);

    // 响应握手信息
    const sendMessage = session.sendMessage({
      type: EMessageType.HANDSHAKE,
      data: handshakeResponseMessage,
    });

    messageContext.attachSession(session);

    session
      .waitMessageResponse(sendMessage, {
        timeout: 30000,
        validate(message: IMessageBaseData<string>) {
          return checkReceiveIsMatchInitMessage(handshakeResponseMessage, message.data!);
        },
      })
      .then(() => {
        session.ready();
      })
      .catch(() => {
        messageContext.detachSession(session);
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
