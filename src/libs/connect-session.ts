import { createSlaveService, defer, IPromiseDefer } from '../util';
import { Class } from '../types';
import { IEventer, IMessageBaseData } from '../interfaces';
import { MessageContext } from './message-context';
import { MBaseService } from '../service';

export interface ISessionSendMessage extends Omit<IMessageBaseData, 'id' | 'channel'> {
  id?: number;
}

export class ConnectSession {
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
   * 内部消息中转
   * @protected
   */
  protected eventer: IEventer;

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

  /**
   * message context
   * @protected
   */
  protected messageContext: MessageContext;

  constructor(protected readonly sender: (message: any) => void) {
    this._openedDefer = defer<void>();
    this._closedDefer = defer<void>();
  }

  /**
   * attach message context
   * @param messageContext
   */
  public attachMessageContext(messageContext: MessageContext) {
    this.messageContext = messageContext;
  }

  /**
   * detach message context
   */
  public detachMessageContext() {
    this.messageContext = null!;
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
  public sendMessage(message: ISessionSendMessage) {
    const mContent: IMessageBaseData = {
      ...message,
      id: message.id ?? this.getMessageId(),
      channel: this.getSenderPort(),
    };
    this.sender(mContent);
    return message;
  }

  /**
   * send message and waitting response
   * @param message
   */
  public sendMessageWithResponse(message: ISessionSendMessage, timeout?: number) {
  }




  /**
   * 获取某个服务
   */
  getService<T extends MBaseService>(serv: Class<T>) {
    return createSlaveService(this.messageContext, this, serv);
  }
}
