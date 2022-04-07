import { createSlaveService, defer, IPromiseDefer } from '../util';
import { Class } from '../types';
import { EMessageType, IMessageBaseData } from '../interfaces';
import { MessageContext } from './message-context';
import { MBaseService } from '../service';
import { uniqId } from '../util/random';
import { createPort } from '../util/session-port';
import { Event } from './event';
import { isBoolean } from 'lodash';

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
  protected port1 = 0;
  /**
   * remote port
   * @protected
   */
  protected port2 = -1;

  /**
   * 内部消息中转
   * @protected
   */
  protected eventer: Event;

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

  constructor(protected readonly name = '', protected readonly sender: (message: any) => void) {
    this._openedDefer = defer<void>();
    this._closedDefer = defer<void>();
    this.port1 = uniqId();
    this.eventer = new Event();
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
    return createPort(this.name, this.port1, this.port2);
  }

  public getReceiverPort() {
    return createPort(this.name, this.port2, this.port1);
  }

  public setPort2(port: number) {
    this.port2 = port;
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
    Promise.resolve().then(() => {
      this.sender(mContent);
    });
    return mContent;
  }

  public attachMessageResponse(message: IMessageBaseData, validate: (message: any) => boolean) {

  }

  /**
   * send message and waitting response
   * @param message
   * @param timeout
   */
  public sendMessageWithResponse(message: ISessionSendMessage, timeout = 30000) {
    const { id } = this.sendMessage(message);
    if (typeof id !== 'number') {
      throw new Error('message id not exists!');
    }

    const { resolve, reject, promise } = defer(timeout);

    const eventId = `res:${id}`;
    const listener = (data: IMessageBaseData) => {
      if (data.type === EMessageType.RESPONSE) {
        resolve(data.data);
      } else if (data.type === EMessageType.RESPONSE_EXCEPTION) {
        reject(data.data);
      }
    };
    this.eventer.on(eventId, listener);

    promise.finally(() => {
      this.eventer.off(eventId);
    });

    return promise;
  }

  /**
   * 获取某个服务
   */
  getService<T extends MBaseService>(serv: Class<T>) {
    return createSlaveService(this.messageContext, this, serv);
  }
}
