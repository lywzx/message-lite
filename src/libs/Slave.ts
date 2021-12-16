import { ConnectService } from '../connect/decl/connect.service';
import { Class } from '../types';
import { createSlaveService } from '../util/create-service';
import { BaseServe } from './base-serve';
import { BaseService } from './base-service';
import { IOpeningOption } from './Master';

export class Slave extends BaseServe {
  protected serviceMap = new Map<Class<any>, BaseService>();

  /**
   * 主动连接Master
   */
  async connect(option: IOpeningOption): Promise<void> {
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

  getRemoteService<T>(serv: Class<T>): T | undefined {
    return undefined;
  }

  getService<T>(serv: Class<T>): T | undefined {
    if (this.serviceMap.has(serv)) {
      return this.serviceMap.get(serv)! as T;
    }
    const service = createSlaveService(this.messageContext, serv);
    this.serviceMap.set(serv, service);
    return service;
  }

  isMaster(): boolean {
    return false;
  }
}
