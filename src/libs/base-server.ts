import { IServerConfig } from '../interfaces';
import { Class } from '../types';
import { defer, IPromiseDefer } from '../util/defer';
import { MessageContext } from './message-context';

export abstract class BaseServer {
  protected messageContext: MessageContext;

  /**
   * 端口打开后调用
   */
  public get opened() {
    return this._openedDefer.promise;
  }

  /**
   * 端口关闭后调用
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

  constructor(option: IServerConfig) {
    this.messageContext = new MessageContext(this, option);
    this._openedDefer = defer<void>();
    this._closedDefer = defer<void>();
  }

  /**
   * 获取某个服务
   */
  abstract getService<T>(serv: Class<T>): T | undefined;

  /**
   * 获取远程方法
   */
  abstract getRemoteService<T>(serv: Class<T>): T | undefined;

  /**
   * 判断当前是否master内容
   */
  abstract isMaster(): boolean;
}
