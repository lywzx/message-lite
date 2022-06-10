import { ConnectSession } from './connect-session';
import {
  checkReceiveIsMatchInitMessage,
  createDefer,
  parseHandshakeMessage,
  sendHandshakeResponseMessage,
  sendInitMessage,
} from '../util';
import { EMessageType, IMessageBaseData } from '../interfaces';
import { WILL_CONNECT } from './message-context';

export class SlaveClient extends ConnectSession {
  connect(): Promise<void> {
    const { messageContext } = this;
    const initMessage = sendInitMessage();

    this.sendMessage({
      type: EMessageType.HANDSHAKE,
      data: initMessage,
    });
    // 开始监听
    messageContext.start();
    let waitConnect = (message: any) => {
      // nowork
    };
    try {
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
        createDefer(option.timeout).promise,
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
    } catch (e) {
      this.isConnecting = false;
      throw e;
    }
  }

  disconnect(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
