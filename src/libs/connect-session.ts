import { createSlaveService, defer, IPromiseDefer } from '../util';
import { Class } from '../types';
import {
  EMessageType,
  IMessageBaseData,
  IConnectSession,
  ISessionSendMessage,
  IConnectSessionWaitResponseOption,
  IMessageContext,
} from '../interfaces';
import { MBaseService } from '../service';
import { uniqId } from '../util/random';
import { createPort } from '../util/session-port';
import { Event } from './event';
import { ServiceEventer } from './service-eventer';

export abstract class ConnectSession implements IConnectSession {
  /**
   * 断开连接
   */
  abstract disconnect(): Promise<void>;

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
  public port1 = 0;
  /**
   * remote port
   * @protected
   */
  public port2 = -1;

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
  protected messageContext: IMessageContext;

  /**
   * session map
   * @protected
   */
  protected serviceMap = new Map<Class<any>, MBaseService>();

  constructor(protected readonly name = '', protected readonly sender: (message: any) => void) {
    this._openedDefer = defer<void>();
    this._closedDefer = defer<void>();
    this.port1 = uniqId();
    this.eventer = new Event();
  }

  public async ready() {
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
  public attachMessageContext(messageContext: IMessageContext) {
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

  public getName() {
    return this.name;
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
  getService<T extends MBaseService>(serv: Class<T>): T {
    if (this.serviceMap.has(serv)) {
      return this.serviceMap.get(serv)! as T;
    }
    const service = createSlaveService(this.messageContext, this, serv, ServiceEventer);
    this.serviceMap.set(serv, service);
    return service;
  }
}
