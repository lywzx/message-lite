import { ConnectSession } from './connect-session';
import { EMessageType, IEvent, IMessageBaseData, IMessageContext, ITimeout } from '../interfaces';
import { checkReceiveIsMatchInitMessage, parseHandshakeMessage, sendHandshakeResponseMessage } from '../util';
import { CONNECTED, CONNECTED_FAILED } from '../constant';

export interface IMasterClientConnectOption extends ITimeout {
  /**
   * 握手消息
   */
  message: string;
  /**
   * 连接的远程端口
   */
  remotePort: number;
  /**
   * 消息管理中心
   */
  messageContext: IMessageContext;
  /**
   * 生命周期的事件
   */
  lifeCircleEvent?: IEvent;
}

export class MasterClient extends ConnectSession {
  disconnect(): Promise<void> {
    return Promise.resolve(undefined);
  }

  connect(option: IMasterClientConnectOption): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const { _openedDefer } = self;
    const { message, messageContext, lifeCircleEvent, timeout = 30000, remotePort } = option;
    const handshakeResponseMessage = sendHandshakeResponseMessage(message!);
    const handshakeResponseMessageObj = parseHandshakeMessage(handshakeResponseMessage);

    self.setPort1(handshakeResponseMessageObj!.offset);
    self.setPort2(remotePort);

    const sendMessage = self.sendMessage({
      type: EMessageType.HANDSHAKE,
      data: handshakeResponseMessage,
    });

    messageContext.attachSession(self);
    return self
      .waitMessageResponse(sendMessage, {
        timeout,
        validate(message: IMessageBaseData<string>) {
          return checkReceiveIsMatchInitMessage(handshakeResponseMessage, message.data!);
        },
      })
      .then(async () => {
        if (lifeCircleEvent) {
          lifeCircleEvent.emit(CONNECTED, self);
        }
        await self.ready();
      })
      .catch((e) => {
        messageContext.detachSession(self);
        if (lifeCircleEvent) {
          lifeCircleEvent.emit(CONNECTED_FAILED, self);
        }
        _openedDefer.resolve(e);
        throw e;
      });
  }
}
