import { ConnectService } from './connect/connect.service';
import { Class } from './types';
import { sendInitMessage } from './util';
import { ConnectSession, BasicServer } from './libs';
import { ISlaveClientConfig } from './interfaces';
import { SlaveConnectImplService } from './connect/slave-connect-impl.service';
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
    this.session = new ConnectSession(this.option.sendMessage);
    this.messageContext.attachSession(this.session);
    this.session.name = option.name || '';
    this.addService([
      {
        decl: ConnectService,
        impl: SlaveConnectImplService,
      },
    ]);
    const connectService = this.getService(ConnectService)!;
    // 发送预连接请求
    await connectService.connect(sendInitMessage());
    // 等待端口打开
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
