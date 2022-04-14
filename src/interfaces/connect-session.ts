import { IMessageBaseData } from './message-data';
import { IMessageContext } from './message-context';

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

export interface IConnectSession {
  /**
   * 连接成功
   */
  opened: Promise<void>;
  /**
   * 关闭连接
   */
  closed: Promise<void>;

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
   * session 状态初始化完成
   */
  ready(): Promise<void>;

  /**
   * 生成message id
   */
  getMessageId(): number;

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
   * 发送消息
   * @param message
   */
  sendMessage(message: ISessionSendMessage): IMessageBaseData;

  /**
   * 接收消息
   * @param message
   */
  receiveMessage(message: ISessionSendMessage): void;

  /**
   * 等待消息的响应数据
   * @param message
   * @param option
   */
  waitMessageResponse(
    message: ISessionSendMessage,
    option: IConnectSessionWaitResponseOption
  ): Promise<IMessageBaseData>;
}
