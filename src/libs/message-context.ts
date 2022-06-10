import {
  EMessageType,
  IConnectSession,
  IMessageBaseData,
  IMessageBroadcast,
  IMessageCallData,
  IMessageConfig,
  IMessageContext,
  IMessageEvent,
  ISessionSendMessage,
} from '../interfaces';
import { createMessageEventName, messageHelper, throwException, uniqId } from '../util';
import { Event } from './event';

/**
 * some client try connect
 */
export const WILL_CONNECT = 'client:will:connect';

/**
 * some client will discount
 */
export const WILL_DISCOUNT = 'client:will:disconnect';

export class MessageContext extends Event implements IMessageContext {
  protected session: Map<string, IConnectSession>;

  protected isReady = false;

  protected t: (message: any) => any;

  constructor(protected readonly option: IMessageConfig) {
    super();
    this.session = new Map<string, IConnectSession>();
    this.t = option.transformMessage || ((m: any) => m);
  }

  sendMessage<T extends ISessionSendMessage>(message: Pick<T, Exclude<keyof T, 'channel'>>): IMessageBaseData<any>;
  sendMessage<T extends ISessionSendMessage>(
    message: Pick<T, Exclude<keyof T, 'channel'>>,
    channel: string
  ): IMessageBaseData<any>;
  sendMessage<T extends ISessionSendMessage>(
    message: Pick<T, Exclude<keyof T, 'channel'>>,
    session: IConnectSession
  ): IMessageBaseData<any>;
  sendMessage(message: any, session?: any) {
    const { option } = this;
    const mContent: IMessageBaseData = {
      ...message,
      id: message.id ?? uniqId(),
      channel: '',
    };

    Promise.resolve().then(() => {
      option.listenMessage(mContent);
    });
    return mContent;
  }

  stop(): void {}
  // 开始监听
  public start() {
    if (this.isReady) {
      throwException('message has ready!');
    }
    this.isReady = true;
    this.option.listenMessage(this.handMessage);
  }

  public attachSession(session: IConnectSession) {
    session.attachMessageContext(this);
    this.session.set(session.getReceiverPort(), session);
  }

  public detachSession(session: IConnectSession | string) {
    const key = typeof session === 'string' ? session : session.getReceiverPort();
    const sess = this.session;
    if (sess.has(key)) {
      const s = sess.get(key)!;
      sess.delete(key);
      s.detachMessageContext();
    }
  }

  public dispose() {
    super.dispose();
    this.isReady = false;
    this.option.unListenMessage(this.handMessage);
  }

  /**
   * receive message hand method
   * @param originMessage
   */
  private handMessage = (originMessage: any) => {
    const message = this.t(originMessage);

    if (messageHelper(message)) {
      // 连接类消息
      const { channel, type } = message;
      const session = this.session.get(channel);
      /*if (!session) {
        if (type === EMessageType.CALL && (message as IMessageCallData).service === CONST_SERVICE_NAME) {
          if ((message as IMessageCallData).method === 'connect') {
            isHandshakeMessage(data) && this.emit(WILL_CONNECT, message, originMessage);
          } else {
            this.emit(WILL_DISCOUNT, message, originMessage);
          }
        }
        return;
      }*/
      switch (type) {
        case EMessageType.HANDSHAKE: {
          // 建立连接
          this.emit(WILL_CONNECT, originMessage);
          break;
        }
        case EMessageType.GOOD_BYE: {
          // 断开连接
          this.emit(WILL_DISCOUNT, message);
          break;
        }
        case EMessageType.EVENT_ON: {
          if (session) {
            session.addServiceListener(message as IMessageEvent);
          }
          break;
        }
        case EMessageType.EVENT_OFF: {
          if (session) {
            session.removeServiceListener(message as IMessageEvent);
          }
          break;
        }

        case EMessageType.CALL: {
          if (session /*&& session.isReady*/) {
            const eventName = createMessageEventName(message as IMessageEvent | IMessageCallData);
            this.emit(eventName, message, session);
          }
          break;
        }
        case EMessageType.EVENT:
        case EMessageType.RESPONSE_EXCEPTION:
        case EMessageType.RESPONSE: {
          if (session) {
            session.receiveMessage(message);
          }
          break;
        }
      }
    }
  };

  /**
   * 事件广播
   */
  public broadcast(message: IMessageBroadcast) {
    this.getSession().forEach((session) => {
      if (session.listened(message)) {
        session.sendMessage({
          ...message,
          type: EMessageType.EVENT,
        });
      }
    });
  }

  public getSession(): Map<string, IConnectSession>;
  public getSession(channel: string): IConnectSession | undefined;
  public getSession(channel?: string): Map<string, IConnectSession> | IConnectSession | undefined {
    if (channel) {
      return this.session.get(channel);
    }
    return this.session as Map<string, IConnectSession>;
  }
}
