import { Class } from './types';
import { throwException } from './util';
import { BasicServer, ConnectSession, SlaveClient, EventEmitter } from './libs';
import { IMessageConfig, ITimeout } from './interfaces';
import { MBaseService } from './service';

export interface IConnectOption extends ITimeout {
  name?: string;
}

export class Slave extends BasicServer {
  protected isConnecting = false;

  protected session!: ConnectSession;

  constructor(protected readonly option: IMessageConfig) {
    super(option);
  }

  /**
   * 主动连接Master
   */
  connect(option: IConnectOption = {}): Promise<void> {
    if (this.isConnecting) {
      throwException('client is connecting server, please not call twice!');
    }
    this.isConnecting = true;
    const session = (this.session = new SlaveClient(option.name, new EventEmitter()));
    session.initSender(this.option.createSender());
    return session
      .connect({
        timeout: option.timeout,
        messageContext: this.messageContext,
      })
      .finally(() => {
        this.isConnecting = false;
      });
  }

  /**
   * 断开连接
   */
  disconnect(): Promise<void> {
    return this.session.disconnect();
  }

  /**
   * call service
   * @param serv
   */
  getService<T extends MBaseService>(serv: Class<T>): T | undefined {
    return this.session.getService(serv);
  }
}
