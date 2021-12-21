import { createSlaveService, defer, IPromiseDefer } from '../util';
import { Class } from '../types';
import { BaseService } from './base-service';
import { IMessageBaseData } from '../interfaces';
import { MessageContext } from './message-context';
import { message } from 'antd';

export class BaseConnectSession {
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
  public name: string;

  /**
   * message id
   * @protected
   */
  protected messageId = 0;

  constructor(protected readonly sender: (message: any) => void, protected readonly messageContext: MessageContext) {
    this._openedDefer = defer<void>();
    this._closedDefer = defer<void>();
  }

  /**
   * generate message id
   */
  public getMessageId() {
    return ++this.messageId;
  }

  public getSenderPort() {
    return [this.port1, this.name, this.port2].join('➜');
  }

  public getReceiverPort() {
    return [this.port2, this.name, this.port1].join('➜');
  }

  /**
   * send message
   * @param message
   */
  public sendMessage(message: Pick<IMessageBaseData, 'type' | 'data'>) {
    const mContent: IMessageBaseData = {
      ...message,
      id: this.getMessageId(),
      channel: this.getSenderPort(),
    };
    this.sender(mContent);
    return message;
  }

  /**
   * 获取某个服务
   */
  getService<T extends BaseService>(serv: Class<T>) {
    return createSlaveService(this.messageContext, this, serv);
  }
}
