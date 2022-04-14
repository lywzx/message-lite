import {
  EMessageType,
  IMessageCallData,
  IMessageEvent,
  IMessageConfig,
  IConnectSession,
  IMessageContext,
} from '../interfaces';
import { messageHelper, createMessageEventName } from '../util';
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

  // 开始监听
  public start() {
    if (this.isReady) {
      throw new Error('message has ready!');
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
    if (this.session.has(key)) {
      const s = this.session.get(key)!;
      this.session.delete(key);
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
        case EMessageType.EVENT_ON:
        case EMessageType.EVENT_OFF:
        case EMessageType.EVENT:
        case EMessageType.CALL: {
          if (session /*&& session.isReady*/) {
            const eventName = createMessageEventName(message as IMessageEvent | IMessageCallData);
            this.emit(eventName, message, session);
          }
          break;
        }
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

  public getSession(): Map<string, IConnectSession>;
  public getSession(channel: string): IConnectSession | undefined;
  public getSession(channel?: string): Map<string, IConnectSession> | IConnectSession | undefined {
    if (channel) {
      return this.session.get(channel);
    }
    return this.session as Map<string, IConnectSession>;
  }
}
