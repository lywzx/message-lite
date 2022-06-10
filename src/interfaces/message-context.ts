import { IEvent } from './event';
import { IConnectSession, ISessionSendMessage } from './connect-session';
import { IMessageBaseData, IMessageEvent } from './message-data';

export type IMessageBroadcast = Omit<IMessageEvent, 'id' | 'channel' | 'type'>;

/**
 * message context
 */
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

  /**
   * 发送消息
   * @param message
   */
  sendMessage<T extends ISessionSendMessage>(message: Omit<T, 'channel'>): IMessageBaseData;
  sendMessage<T extends ISessionSendMessage>(message: Omit<T, 'channel'>, channel: string): IMessageBaseData;
  sendMessage<T extends ISessionSendMessage>(message: Omit<T, 'channel'>, session: IConnectSession): IMessageBaseData;
  /**
   * 停止
   */
  stop(): void;
}
