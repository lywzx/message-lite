import { ConnectService } from './connect/connect.service';
import { Class } from './types';
import { createSlaveService, defer, sendInitMessage } from './util';
import { BaseConnectSession, BaseService, MessageContext } from './libs';
import { ISlaveClientConfig } from './interfaces';

export interface IConnectOption {
  name?: string;
  timeout?: number;
}

export class Slave {
  protected isConnecting = false;
  protected session!: BaseConnectSession;

  protected messageContext: MessageContext;

  constructor(protected readonly option: ISlaveClientConfig) {
    this.messageContext = new MessageContext(option);
  }

  protected serviceMap = new Map<Class<any>, BaseService>();

  /**
   * 主动连接Master
   */
  async connect(option: IConnectOption): Promise<void> {
    if (this.isConnecting) {
      throw new Error('client is connecting server, please not call twice!');
    }
    this.session = new BaseConnectSession(this.option.sendMessage, this.messageContext);
    this.session.name = option.name || '';
    const connectService = this.getService(ConnectService)!;
    // 发送预连接请求
    await connectService.preConnect(sendInitMessage());
    // 等待端口打开
    const df = defer<void>(option.timeout || 3000);
    // 等待
    await this._openedDefer.resolve(df.promise);

    try {
      const service = createSlaveService(this.messageContext, ConnectService);
      this.messageContext.start();
      this.messageContext.setChannel(option.clientId);
      const result = await service.connect(option.clientId, {
        timeout: option.timeout,
      });
      this.messageContext.setChannel(result);
      this.messageContext.readied();
      this._openedDefer.resolve();
    } catch (e) {
      this._openedDefer.reject(e);
    }
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
  getService<T extends BaseService>(serv: Class<T>): T | undefined {
    if (this.serviceMap.has(serv)) {
      return this.serviceMap.get(serv)! as T;
    }
    const service = this.session.getService(serv);
    this.serviceMap.set(serv, service);
    return service;
  }
}
