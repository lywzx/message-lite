import {
  createMessageEventName,
  createSlaveService,
  createDefer,
  getApiDeclInfo,
  IPromiseDefer,
  throwException,
  plainToError,
} from '../util';
import { Class } from '../types';
import {
  IConnectSession,
  IEvent,
  IListenOption,
  IMessageBaseData,
  IMessageContext,
  IMessageEvent,
  ISessionSendMessage,
  ITimeout,
  IWaitMessageResponseOption,
} from '../interfaces';
import { uniqId, createPort } from '../util';
import { ServiceEventer, ServiceEventerInnerEmit } from './service-eventer';
import {
  EMessageTypeEvent,
  EMessageTypeResponse,
  EMessageTypeResponseException,
  ESessionStateClosed,
  ESessionStateClosingStart,
  ESessionStateClosingWaitingSecondApprove,
  ESessionStateInit,
} from '../constant';
import { MBaseService } from '../service/m-base-service';
import { ConnectService, setDefer } from '../service';

export abstract class ConnectSession implements IConnectSession {
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
  protected state = ESessionStateInit;

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
   * message context
   * @protected
   */
  protected messageContext: IMessageContext;

  /**
   * session map
   * @protected
   */
  protected serviceMap = new Map<string, MBaseService>();

  /**
   * message origin sender
   * @protected
   */
  protected s!: (m: any) => any;

  /**
   * @param name 客户端名称
   * @param eventer 事件代码
   */
  constructor(protected readonly name = '', protected readonly eventer: IEvent) {
    this._openedDefer = createDefer<void>();
    this._closedDefer = createDefer<void>();
    this.port1 = uniqId();
  }

  /**
   * get client state
   */
  getState(): number {
    return this.state;
  }

  /**
   * 开始连接
   */
  abstract connect(option: ITimeout): Promise<void>;

  /**
   * 断开连接
   */
  public async disconnect(): Promise<void> {
    const service = this.getService(ConnectService);

    const defer = createDefer<void>();
    setDefer(this, defer);

    // 开始准备关闭
    const state = this.state;
    this.state = ESessionStateClosingStart;

    // 触发断开连接
    await service.disconnect().catch((e) => {
      this.state = state;
      setDefer(this);
      throw e;
    });
    // 等待二次确认
    this.state = ESessionStateClosingWaitingSecondApprove;
    // 关闭成功
    return defer.promise
      .then(() => new Promise((r) => setTimeout(r, 50)))
      .then(async () => {
        this.messageContext.detachSession(this);
        this.state = ESessionStateClosed;
        setDefer(this);
      });
  }

  /**
   * 初始化消息发布
   * @param sender
   */
  public initSender(sender: (m: any) => any): void {
    this.s = sender;
  }

  /**
   * sender message
   * @param message
   */
  public sendMessage<T extends ISessionSendMessage>(
    message: Pick<T, Exclude<keyof T, 'channel'>>
  ): IMessageBaseData<T> {
    const { s, name, port1, port2 } = this;
    const mContent: IMessageBaseData = {
      ...message,
      id: message.id ?? uniqId(),
      channel: createPort(name, port1, port2),
    };

    if (typeof s !== 'function') {
      throwException('please init sender before send message');
    }
    Promise.resolve().then(() => {
      s(mContent);
    });
    return mContent;
  }

  sendMessageWithResponse(message: ISessionSendMessage, option: IWaitMessageResponseOption) {
    const { timeout } = option;
    const msg = this.sendMessage(message);

    return this.waitMessageResponse(msg, {
      timeout,
      validate: (data: IMessageBaseData) => [EMessageTypeResponse, EMessageTypeResponseException].includes(data.type),
    });
  }

  waitMessageResponse<T extends ISessionSendMessage>(
    message: Omit<T, 'channel'>,
    option: IWaitMessageResponseOption
  ): Promise<any> {
    const { id } = message;
    const { eventer } = this;
    const { timeout, validate = () => true } = option;
    const { resolve, promise, reject } = createDefer<T>(timeout);
    const eventId = `res:${id}`;
    const listener = (data: T) => {
      if (validate(data)) {
        if (data.type === EMessageTypeResponseException) {
          const error = data.data ? plainToError(data.data) : new Error('unknown error from message-lite');
          reject(error);
        } else {
          resolve(data.data);
        }
      }
    };

    eventer.once(eventId, listener);

    return promise.finally(() => {
      eventer.off(eventId, listener, true);
    });
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
    this._closedDefer.resolve();
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

  public receiveMessage(message: ISessionSendMessage) {
    const { eventer } = this;
    switch (message.type) {
      case EMessageTypeEvent: {
        const m = message as IMessageEvent;
        eventer.emit(createMessageEventName(m, false), m.data);
        break;
      }
      default: {
        eventer.emit(`res:${message.fromId!}`, message);
      }
    }
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
    const { serviceMap, eventer } = this;
    const name = info.name;
    if (serviceMap.has(name)) {
      return this.getServiceByServiceName(name);
    }
    const service = createSlaveService(this.messageContext, this, serv, ServiceEventer);
    serviceMap.set(name, service);
    info.events.forEach((evt) => {
      const evtName = createMessageEventName({
        service: name,
        event: evt.name,
      });
      eventer.on(evtName, (...args: any) => {
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
