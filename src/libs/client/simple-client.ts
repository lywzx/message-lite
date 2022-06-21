import { ConnectSession } from '../connect-session';
import { ITimeout } from '../../interfaces';
import { sendHandshakeResponseMessage } from '../../util';
import { EMessageTypeHandshake, ESessionStateReady } from '../../constant';

export interface ISimpleClientConnectOption extends ITimeout {
  message?: string;
}

export class SimpleClient extends ConnectSession {
  connect(option: ISimpleClientConnectOption) {
    const { message } = option;
    const handshakeResponseMessage = sendHandshakeResponseMessage(message!);

    this.sendMessage({
      type: EMessageTypeHandshake,
      data: handshakeResponseMessage,
    });
    this.state = ESessionStateReady;

    return new Promise<void>((r) => setTimeout(r, 50));
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
