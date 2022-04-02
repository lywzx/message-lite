import { EMessageType, IMessageCallData, IMessageEvent, IMessageResponseData, IMessageConfig } from '../interfaces';
import { Class } from '../types';
import {
  getApiDeclInfo,
  defer,
  IPromiseDefer,
  messageHelper,
  createMessageEventName,
  isHandshakeMessage,
} from '../util';
import { Event } from './event';
import { ConnectSession } from './connect-session';
import { CONST_SERVICE_NAME } from '../connect/connect.service';
import { MBaseService } from '../service';

/**
 * some client try connect
 */
export const WILL_CONNECT = 'client:will:connect';

/**
 * some client will discount
 */
export const WILL_DISCOUNT = 'client:will:disconnect';

export class MessageContext extends Event {
  protected pendingMap: Map<string, IPromiseDefer<any>>;

  protected session: Map<string, ConnectSession>;

  protected isReady = false;

  protected t: (message: any) => any;

  constructor(protected readonly option: IMessageConfig) {
    super();
    this.pendingMap = new Map();
    this.t = option.transformMessage || ((m: any) => m);
  }

  // 开始监听
  public start() {
    if (this.isReady) {
      throw new Error('message has ready!');
    }
    this.option.listenMessage(this.handMessage);
  }

  public readied() {
    this.isReady = true;
  }

  public attachSession(session: ConnectSession) {
    session.attachMessageContext(this);
    this.session.set(session.getReceiverPort(), session);
  }

  public detachSession(session: ConnectSession | string) {
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

  public whenServiceCalled<T extends MBaseService>(
    serv: Class<T>,
    option: {
      method: string;
      once?: boolean;
      timeout?: number;
    }
  ) {
    const servInfo = getApiDeclInfo(serv);
    const df = defer<any>(option.timeout);

    const fn = (data: any) => {
      df.resolve(data);
    };
    const eventName = `${servInfo.name}:${option.method}:call`;
    this.once(eventName, fn);

    df.promise.finally(() => {
      this.off(eventName, fn);
    });

    return df.promise;
  }

  /**
   * receive message hand method
   * @param originMessage
   */
  private handMessage = (originMessage: any) => {
    const message = this.t(originMessage);
    if (messageHelper(message)) {
      // 连接类消息
      const { channel, id = '', data, type } = message;

      const session = this.session.get(channel);
      if (!session) {
        if (type === EMessageType.CALL && (message as IMessageCallData).service === CONST_SERVICE_NAME) {
          if ((message as IMessageCallData).method === 'connect') {
            isHandshakeMessage(data) && this.emit(WILL_CONNECT, message, originMessage);
          } else {
            this.emit(WILL_DISCOUNT, message, originMessage);
          }
        }
        return;
      }
      switch (type) {
        case EMessageType.EVENT_ON:
        case EMessageType.EVENT_OFF:
        case EMessageType.EVENT:
        case EMessageType.CALL: {
          const eventName = createMessageEventName(message as IMessageEvent | IMessageCallData);
          this.emit(eventName, data, session);
          break;
        }
        case EMessageType.RESPONSE_EXCEPTION:
        case EMessageType.RESPONSE: {
          const data = message as IMessageResponseData;
          const pendingMap = this.pendingMap;
          const key = `${channel}-${id}`;
          if (pendingMap.has(key)) {
            const df = pendingMap.get(key)!;
            data.type === EMessageType.RESPONSE_EXCEPTION ? df.reject(new Error(data.data)) : df.resolve(data.data);
          }
          break;
        }
      }
    }
  };

  public getSession(channel: string) {
    return this.session.get(channel);
  }

  public async waitMessageResponse(message: IMessageCallData, option: { timeout: number }) {
    const df = defer<any>(option.timeout);

    return df.promise;
  }
}

export interface IMessageContextSendMessage<T = any> {
  /**
   * message uniq id
   */
  sessionId: string;
  /**
   * message data content
   */
  data: T;
}

export interface IMessageOption {
  notify: boolean;
  timeout: number;
}
