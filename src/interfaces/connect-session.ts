import { IMessageBaseData, IMessageEvent } from './message-data';
import { IMessageContext, IWaitMessageResponseOption } from './message-context';
import { MBaseService } from '../service';
import { Class } from '../types';

export type IListenOption = Pick<IMessageEvent, 'service' | 'event'>;

export interface ISessionSendMessage extends Omit<IMessageBaseData, 'id' | 'channel'> {
  fromId?: number;
  id?: number;
}

export interface ITimeout {
  timeout?: number;
}

/**
 * 响应
 */
export interface IConnectSessionWaitResponseOption extends ITimeout {
  validate?: (value: any) => boolean;
}

/**
 * session 连接
 */
export interface IConnectSession {
  /**
   * 连接成功
   */
  readonly opened: Promise<void>;
  /**
   * 关闭连接
   */
  readonly closed: Promise<void>;

  /**
   * 自身端口
   */
  port1: number;
  /**
   * 远程端口
   */
  port2: number;
  /**
   * 断开连接
   */
  disconnect(): Promise<void>;

  /**
   * 开始连接
   */
  connect(option: ITimeout): Promise<void>;

  /**
   * session 状态初始化完成
   */
  ready(): Promise<void>;

  /**
   * 获取发送端口
   */
  getSenderPort(): string;

  /**
   * 获取接收端口
   */
  getReceiverPort(): string;

  /**
   * 获取名称
   */
  getName(): string;

  /**
   * attach message context
   */
  attachMessageContext(messageContext: IMessageContext): void;

  /**
   * detach message context
   */
  detachMessageContext(): void;

  /**
   * 接收消息
   * @param message
   */
  receiveMessage(message: ISessionSendMessage): void;

  /**
   * 初始化sender
   * @throws
   */
  initSender(sender: (s: any) => any): void;

  /**
   * 发送消息
   * @param message
   */
  sendMessage<T extends ISessionSendMessage>(message: Omit<T, 'channel'>): IMessageBaseData<T>;

  /**
   * 等待消息的响应
   * @param message
   * @param option
   */
  waitMessageResponse<T extends ISessionSendMessage>(message: T, option: IWaitMessageResponseOption): Promise<T>;

  /**
   * 发送消息并等待响应
   * @param message
   * @param option
   */
  sendMessageWithResponse<T extends ISessionSendMessage>(
    message: ISessionSendMessage,
    option?: IWaitMessageResponseOption
  ): Promise<IMessageBaseData<T>>;

  /**
   * 添加某个服务监听
   * @param opt
   */
  addServiceListener(opt: IListenOption): boolean;

  /**
   * 移除某个服务监听
   * @param opt
   */
  removeServiceListener(opt: IListenOption): boolean;

  /**
   * 判断是否监听了此消息
   * @param opt
   */
  listened(opt: IListenOption): boolean;

  /**
   * 获取某个服务
   * @param serv
   */
  getService<T extends MBaseService>(serv: Class<T>): T;
}
