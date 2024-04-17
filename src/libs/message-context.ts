import {
  IConnectSession,
  IMessageBroadcast,
  IMessageCallData,
  IMessageConfig,
  IMessageContext,
  IMessageEvent,
} from '../interfaces';
import { createMessageEventName, messageHelper, throwException } from '../util';
import { EventEmitter } from './event-emitter';
import {
  EMessageTypeCall,
  EMessageTypeEvent,
  EMessageTypeEventOff,
  EMessageTypeEventOn,
  EMessageTypeGoodBye,
  EMessageTypeGoodByeTwice,
  EMessageTypeHandshake,
  EMessageTypeResponse,
  EMessageTypeResponseException,
} from '../constant';

/**
 * some client try connect
 */
export const WILL_CONNECT = 'client:will:connect';

/**
 * some client will discount
 */
export const WILL_DISCOUNT = 'client:will:disconnect';

export class MessageContext extends EventEmitter implements IMessageContext {
  protected session: Map<string, IConnectSession>;

  protected isReady = false;

  protected t: (...message: any[]) => any;

  constructor(protected readonly option: Omit<IMessageConfig, 'createSender'>) {
    super();
    this.session = new Map<string, IConnectSession>();
    this.t = option.transformMessage || ((m: any) => m);
  }

  stop(): void {
    this.dispose();
    this.session = null!;
    this.isReady = false;
    this.isReady = false;
    this.option.unListenMessage(this.handMessage);
  }

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

  /**
   * receive message hand method
   * @param originMessage
   */
  private handMessage = (...originMessage: any[]) => {
    const message = this.t(...originMessage);

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
        case EMessageTypeHandshake: {
          // 建立连接
          this.emit(WILL_CONNECT, message, ...originMessage);
          break;
        }
        case EMessageTypeGoodBye: {
          if (session) {
            // 断开连接
            this.emit(WILL_DISCOUNT, message, session);
          }
          break;
        }
        case EMessageTypeEventOn: {
          if (session) {
            session.addServiceListener(message as IMessageEvent);
          }
          break;
        }
        case EMessageTypeEventOff: {
          if (session) {
            session.removeServiceListener(message as IMessageEvent);
          }
          break;
        }

        case EMessageTypeCall: {
          if (session /*&& session.isReady*/) {
            const eventName = createMessageEventName(message as IMessageEvent | IMessageCallData);
            this.emit(eventName, message, session);
          }
          break;
        }
        case EMessageTypeGoodByeTwice:
        case EMessageTypeEvent:
        case EMessageTypeResponseException:
        case EMessageTypeResponse: {
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
          type: EMessageTypeEvent,
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
