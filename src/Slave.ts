import { Class } from './types';
import { sendInitMessage } from './util';
import { BasicServer, ConnectSession } from './libs';
import { EMessageType, ISlaveClientConfig } from './interfaces';
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

  protected serviceMap = new Map<Class<any>, MBaseService>();

  /**
   * 主动连接Master
   */
  async connect(option: IConnectOption): Promise<void> {
    if (this.isConnecting) {
      throw new Error('client is connecting server, please not call twice!');
    }
    const session = (this.session = new ConnectSession(option.name, this.option.sendMessage));
    this.messageContext.attachSession(this.session);

    session.sendMessageWithResponse({
      type: EMessageType.HANDSHAKE,
      data: sendInitMessage(),
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
    if (this.serviceMap.has(serv)) {
      return this.serviceMap.get(serv)! as T;
    }
    const service = this.session.getService(serv);
    this.serviceMap.set(serv, service);
    return service;
  }
}
