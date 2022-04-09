import { createSlaveService, defer, IPromiseDefer } from '../util';
import { Class } from '../types';
import { EMessageType, IMessageBaseData } from '../interfaces';
import { MessageContext } from './message-context';
import { MBaseService } from '../service';
import { uniqId } from '../util/random';
import { createPort } from '../util/session-port';
import { Event } from './event';

export interface ISessionSendMessage extends Omit<IMessageBaseData, 'id' | 'channel'> {
  fromId?: number;
  id?: number;
}

/**
 * 响应
 */
export interface IConnectSessionWaitResponseOption {
  timeout?: number;
  validate?: (value: any) => boolean;
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
   * 当前session是否处理ready状态
   */
  public isReady = false;

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

  public ready() {
    this.isReady = true;
    this._openedDefer.resolve();
  }

  public release() {
    this._openedDefer.resolve();
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
    this._openedDefer.resolve();
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

  public setPort1(port: number) {
    this.port1 = port;
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

  /**
   *
   * @param message
   * @param option
   */
  public waitMessageResponse(message: ISessionSendMessage, option: IConnectSessionWaitResponseOption = {}) {
    const { id } = message;
    const { timeout, validate = () => true } = option;
    const { resolve, promise } = defer<IMessageBaseData>(timeout);
    const eventId = `res:${id}`;
    const listener = (data: IMessageBaseData) => {
      if (validate(data)) {
        resolve(data);
      }
    };
    this.eventer.on(eventId, listener);

    return promise.finally(() => {
      this.eventer.off(eventId, listener);
    });
  }

  public receiveMessage(message: ISessionSendMessage) {
    this.eventer.emit(`res:${message.fromId!}`, message);
  }

  /**
   * send message and waitting response
   * @param message
   * @param timeout
   */
  public sendMessageWithResponse(message: ISessionSendMessage, timeout = 30000) {
    const msg = this.sendMessage(message);

    return this.waitMessageResponse(msg, {
      timeout,
      validate: (data: IMessageBaseData) =>
        [EMessageType.RESPONSE, EMessageType.RESPONSE_EXCEPTION].includes(data.type),
    }).then((data) => {
      if (data.type === EMessageType.RESPONSE) {
        return data.data;
      } else if (data.type === EMessageType.RESPONSE_EXCEPTION) {
        throw new Error(data.data);
      }
    });
  }

  /**
   * 获取某个服务
   */
  getService<T extends MBaseService>(serv: Class<T>) {
    return createSlaveService(this.messageContext, this, serv);
  }
}
