import { ConnectSession } from './connect-session';
import { IEvent, IMessageBaseData, IMessageContext, ITimeout } from '../interfaces';
import {
  checkReceiveIsMatchInitMessage,
  parseHandshakeMessage,
  sendHandshakeResponseMessage,
  throwException,
} from '../util';
import {
  CONNECTED,
  CONNECTED_FAILED,
  EMessageTypeHandshake,
  ESessionStateClosed,
  ESessionStateInit,
  ESessionStateOpening,
  ESessionStateReady,
} from '../constant';

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
  connect(option: IMasterClientConnectOption): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const { _openedDefer, state } = self;
    if (![ESessionStateInit, ESessionStateClosed].includes(state)) {
      throwException('client is active, can not connect!');
    }

    const { message, messageContext, lifeCircleEvent, timeout = 30000, remotePort } = option;
    const handshakeResponseMessage = sendHandshakeResponseMessage(message!);
    const handshakeResponseMessageObj = parseHandshakeMessage(handshakeResponseMessage);

    self.setPort1(handshakeResponseMessageObj!.offset);
    self.setPort2(remotePort);

    const sendMessage = self.sendMessage({
      type: EMessageTypeHandshake,
      data: handshakeResponseMessage,
    });

    self.state = ESessionStateOpening;

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
        self.state = ESessionStateReady;
        _openedDefer.resolve();
      })
      .catch((e) => {
        messageContext.detachSession(self);
        if (lifeCircleEvent) {
          lifeCircleEvent.emit(CONNECTED_FAILED, self);
        }
        self.state = ESessionStateClosed;
        _openedDefer.reject(e);
        throw e;
      });
  }
}
