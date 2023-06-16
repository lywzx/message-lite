import { IEvent } from './event';
import { IConnectSession } from './connect-session';
import { IMessageEvent } from './message-data';
import { IMessageConfig } from './server-config';

export type IMessageBroadcast = Omit<IMessageEvent, 'id' | 'channel' | 'type'>;

export interface IWaitMessageResponseOption {
  /**
   * 过期时间
   */
  timeout?: number;
  /**
   * validate current message is fit current session
   * @param value
   */
  validate?: (value: any) => boolean;
}

/**
 * message context
 */
export interface IMessageContextConstructor {
  /**
   * message constructor option
   * @param option
   */
  new (option: IMessageConfig<any>): IMessageContext;
}

/**
 * message context
 */
export interface IMessageContext extends IEvent<any> {
  /**
   * 启动
   */
  start(): void;
  /**
   * 停止
   */
  stop(): void;
  /**
   * 获取session数据
   */
  getSession(): Map<string, IConnectSession>;
  getSession(channel: string): IConnectSession | undefined;
  getSession(channel?: string): Map<string, IConnectSession> | IConnectSession | undefined;

  /**
   * attach session
   * @param session
   */
  attachSession(session: IConnectSession): void;

  /**
   * detach session
   * @param session
   */
  detachSession(session: IConnectSession | string): void;

  /**
   * 广播
   */
  broadcast(message: IMessageBroadcast): void;
}
