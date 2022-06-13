import { ConnectSession } from './connect-session';
import {
  checkReceiveIsMatchInitMessage,
  createDefer,
  parseHandshakeMessage,
  sendHandshakeResponseMessage,
  sendInitMessage,
} from '../util';
import { IMessageBaseData, IMessageContext, ITimeout } from '../interfaces';
import { WILL_CONNECT } from './message-context';
import { EMessageTypeHandshake, EMessageTypeResponse } from '../constant';

export interface ISlaveClientConnectOption extends ITimeout {
  messageContext: IMessageContext;
}

export class SlaveClient extends ConnectSession {
  async connect(option: ISlaveClientConnectOption): Promise<void> {
    const { messageContext, timeout = 3000 } = option;
    const initMessage = sendInitMessage();

    this.sendMessage({
      type: EMessageTypeHandshake,
      data: initMessage,
    });
    // 开始监听
    messageContext.start();
    let waitConnect = (message: IMessageBaseData, messageOrigin: any) => {
      // nowork
    };
    try {
      // 等待消息响应
      const response = (await Promise.race([
        new Promise((resolve) => {
          waitConnect = (message: IMessageBaseData, messageOrigin: any) => {
            const res = message.data || '';
            if (checkReceiveIsMatchInitMessage(initMessage, res)) {
              resolve(message);
            }
          };
          messageContext.on(WILL_CONNECT, waitConnect);
        }),
        createDefer(timeout, (timeout) => new Error('slave connect timeout.')).promise,
      ]).finally(() => {
        messageContext.off(WILL_CONNECT, waitConnect);
      })) as IMessageBaseData;
      const handshake = response.data;
      const handshakeMessage = parseHandshakeMessage(handshake)!;

      this.setPort2(handshakeMessage.offset);
      messageContext.attachSession(this);

      this.sendMessage({
        fromId: response.id,
        data: sendHandshakeResponseMessage(response.data),
        type: EMessageTypeResponse,
      });
      this._openedDefer.resolve();
    } catch (e) {
      this._openedDefer.reject(e);
      throw e;
    }
  }

  disconnect(): Promise<void> {
    return this._closedDefer.promise;
  }
}
