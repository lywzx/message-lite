import { Class } from './types';
import {
  checkReceiveIsMatchInitMessage,
  defer,
  parseHandshakeMessage,
  sendHandshakeResponseMessage,
  sendInitMessage,
} from './util';
import { BasicServer, ConnectSession, WILL_CONNECT } from './libs';
import { EMessageType, IMessageBaseData, ISlaveClientConfig } from './interfaces';
import { MBaseService } from './service';

export interface IConnectOption {
  name?: string;
  timeout?: number;
}

export class Slave extends BasicServer {
  protected isConnecting = false;

  protected session!: ConnectSession;

  constructor(protected readonly option: ISlaveClientConfig) {
    super(option);
  }

  /**
   * 主动连接Master
   */
  async connect(option: IConnectOption): Promise<void> {
    if (this.isConnecting) {
      throw new Error('client is connecting server, please not call twice!');
    }
    const session = (this.session = new ConnectSession(option.name, this.option.sendMessage));
    const { messageContext, option: slaveOption } = this;
    const initMessage = sendInitMessage();

    session.sendMessage({
      type: EMessageType.HANDSHAKE,
      data: initMessage,
    });
    // 开始监听
    messageContext.start();
    let waitConnect = (message: any) => {
      // nowork
    };
    // 等待消息响应
    const response = (await Promise.race([
      new Promise((resolve) => {
        waitConnect = (message: any) => {
          const msg = (
            slaveOption.transformMessage ? slaveOption.transformMessage(message) : message
          ) as IMessageBaseData;
          const res = msg?.data || '';
          if (checkReceiveIsMatchInitMessage(initMessage, res)) {
            resolve(msg);
          }
        };
        messageContext.on(WILL_CONNECT, waitConnect);
      }),
      defer(option.timeout).promise,
    ]).finally(() => {
      messageContext.off(WILL_CONNECT, waitConnect);
    })) as IMessageBaseData;
    const handshake = response.data;
    const handshakeMessage = parseHandshakeMessage(handshake)!;

    session.setPort2(handshakeMessage.offset);
    messageContext.attachSession(session);

    // 再发送一条信息给到serve，以表示客户端准备好了
    session.sendMessage({
      fromId: response.id,
      data: sendHandshakeResponseMessage(response.data),
      type: EMessageType.RESPONSE,
    });
  }

  /**
   * 断开连接
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async disconnect(): Promise<void> {}

  /**
   * call service
   * @param serv
   */
  getService<T extends MBaseService>(serv: Class<T>): T | undefined {
    return this.session.getService(serv);
  }
}
