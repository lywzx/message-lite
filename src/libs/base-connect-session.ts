import { defer, IPromiseDefer } from '../util';
import { Class } from '../types';
import { BaseService } from './base-service';

export abstract class BaseConnectSession {
  /**
   * wait session opened
   */
  public get opened() {
    return this._openedDefer.promise;
  }

  /**
   * wait session closed
   */
  public get closed() {
    return this._closedDefer.promise;
  }

  /**
   * 建立连接时的defer对象
   * @protected
   */
  protected _openedDefer: IPromiseDefer<void>;
  /**
   * 关闭连接时的defer对象
   * @protected
   */
  protected _closedDefer: IPromiseDefer<void>;

  /**
   * self port
   * @protected
   */
  protected port1: string;
  /**
   * remote port
   * @protected
   */
  protected port2: string;

  /**
   * session name
   * @protected
   */
  protected name: string;

  /**
   * message id
   * @protected
   */
  protected messageId = 0;

  constructor() {
    this._openedDefer = defer<void>();
    this._closedDefer = defer<void>();
  }

  public getSenderPort() {
    return [this.port1, this.name, this.port2].join('➜');
  }

  public getReceiverPort() {
    return [this.port2, this.name, this.port1].join('➜');
  }
  /**
   * 获取某个服务
   */
  abstract getService<T extends BaseService>(serv: Class<T>): T | undefined;
}
