import { createMessageEventName, createSlaveService, defer, getApiDeclInfo, IPromiseDefer } from '../util';
import { Class } from '../types';
import {
  EMessageType,
  IMessageBaseData,
  IConnectSession,
  ISessionSendMessage,
  IConnectSessionWaitResponseOption,
  IMessageContext,
  IListenOption,
  IMessageEvent,
} from '../interfaces';
import { MBaseService } from '../service';
import { uniqId } from '../util/random';
import { createPort } from '../util/session-port';
import { Event } from './event';
import { ServiceEventer, ServiceEventerInnerEmit } from './service-eventer';

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
   * 当前监听的所有服务
   * @protected
   */
  protected listenServiceSet = new Set<string>();

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
  protected serviceMap = new Map<string, MBaseService>();

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
  public sendMessage<T extends ISessionSendMessage>(message: Omit<T, 'channel'>) {
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
  public waitMessageResponse<T extends ISessionSendMessage>(
    message: Omit<T, 'channel'>,
    option: IConnectSessionWaitResponseOption = {}
  ) {
    const { id } = message;
    const { timeout, validate = () => true } = option;
    const { resolve, promise } = defer<T>(timeout);
    const eventId = `res:${id}`;
    const listener = (data: T) => {
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
    switch (message.type) {
      case EMessageType.EVENT: {
        const m = message as IMessageEvent;
        this.eventer.emit(createMessageEventName(m, false), m.data);
        break;
      }
      default: {
        this.eventer.emit(`res:${message.fromId!}`, message.data);
      }
    }
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
   * 通过名称来获取某个服务
   * @param name
   * @protected
   */
  protected getServiceByServiceName<T extends MBaseService>(name: string): T {
    return this.serviceMap.get(name) as T;
  }

  /**
   * 获取某个服务
   */
  getService<T extends MBaseService>(serv: Class<T>): T {
    const info = getApiDeclInfo(serv);
    if (this.serviceMap.has(info.name)) {
      return this.getServiceByServiceName(info.name);
    }
    const service = createSlaveService(this.messageContext, this, serv, ServiceEventer);
    this.serviceMap.set(info.name, service);
    info.events.forEach((evt) => {
      const evtName = createMessageEventName({
        service: info.name,
        event: evt.name,
      });
      this.eventer.on(evtName, (...args: any) => {
        (service as any)[evt.name][ServiceEventerInnerEmit](...args);
      });
    });
    return service;
  }

  /**
   * 添加某个服务事件
   * @param opt
   */
  addServiceListener(opt: IListenOption): boolean {
    if (!this.listened(opt)) {
      this.listenServiceSet.add(createMessageEventName(opt, false));
      return true;
    }
    return false;
  }

  /**
   * 判断某个服务事件是否监听
   * @param opt
   */
  listened(opt: IListenOption): boolean {
    return this.listenServiceSet.has(createMessageEventName(opt, false));
  }

  /**
   * 移除某个服务事件监听
   * @param opt
   */
  removeServiceListener(opt: IListenOption) {
    if (this.listened(opt)) {
      this.listenServiceSet.delete(createMessageEventName(opt, false));
      return true;
    }
    return false;
  }
}
