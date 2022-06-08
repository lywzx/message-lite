import { IEvent } from './event';
import { IConnectSession } from './connect-session';
import { IMessageEvent } from './message-data';

export type IMessageBroadcast = Omit<IMessageEvent, 'id' | 'channel' | 'type'>;

export interface IMessageContext extends IEvent {
  /**
   * 启动
   */
  start(): void;

  /**
   * 获取session数据
   */
  getSession(): Map<string, IConnectSession>;
  getSession(channel: string): IConnectSession | undefined;
  getSession(channel?: string): Map<string, IConnectSession> | IConnectSession | undefined;

  /**
   * 广播
   */
  broadcast(message: IMessageBroadcast): void;
}