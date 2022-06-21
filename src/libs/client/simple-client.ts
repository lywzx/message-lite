import { ConnectSession } from '../connect-session';
import { ITimeout } from '../../interfaces';
import { sendHandshakeResponseMessage } from '../../util';
import { EMessageTypeHandshake, ESessionStateReady } from '../../constant';
import { ConnectService } from '../../service';

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

    return new Promise<void>((r) =>
      setTimeout(() => {
        r();
        this._openedDefer.resolve();
      }, 50)
    );
  }

  disconnect(): Promise<void> {
    const { _closedDefer } = this;

    return this.getService(ConnectService)!
      .disconnect()
      .then(() => {
        _closedDefer.resolve();
        this.messageContext.detachSession(this);
      });
  }
}
