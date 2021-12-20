import { EMessageType, IMessageCallData, IMessageEvent, IMessageResponseData, IServerConfig } from '../interfaces';
import { Class } from '../types';
import { getApiDeclInfo, defer, IPromiseDefer, isValidateMessage } from '../util';
import { BaseService } from './base-service';
import { Event } from './event';
import { BaseConnectSession } from './base-connect-session';

export class MessageContext extends Event {
  protected pendingMap: Map<string, IPromiseDefer<any>>;

  protected session: Map<string, BaseConnectSession>;

  protected isReady = false;

  constructor(protected readonly option: IServerConfig) {
    super();
    this.pendingMap = new Map();
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

  public attachSession(session: BaseConnectSession) {
    this.session.set(session.getReceiverPort(), session);
  }

  public detachSession(session: BaseConnectSession | string) {
    const key = typeof session === 'string' ? session : session.getReceiverPort();
    if (this.session.has(key)) {
      this.session.delete(key);
    }
  }

  public dispose() {
    super.dispose();
    this.isReady = false;
    this.option.unListenMessage(this.handMessage);
  }

  public whenServiceCalled<T extends BaseService>(
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

  private handMessage = (message: any) => {
    if (isValidateMessage(message) && this.session.has(message.channel)) {
      const session = this.session.get(message.channel);
      switch (message.type) {
        case EMessageType.EVENT_ON: {
          const data = message as IMessageEvent;
          this.emit(`${data.service}:${data.event}:on`, undefined, session);
          break;
        }
        case EMessageType.EVENT_OFF: {
          const data = message as IMessageEvent;
          this.emit(`${data.service}:${data.event}:off`, undefined, session);
          break;
        }
        case EMessageType.EVENT: {
          const data = message as IMessageEvent;
          this.emit(`${data.service}:${data.event}:emit`, data, session);
          break;
        }
        case EMessageType.CALL: {
          const data = message as IMessageCallData;
          this.emit(`${data.service}:${data.method}:call`, data, session);
          break;
        }
        case EMessageType.RESPONSE_EXCEPTION:
        case EMessageType.RESPONSE: {
          const data = message as IMessageResponseData;
          const pendingMap = this.pendingMap;
          const key = `${data.channel}-${data.id}`;
          if (pendingMap.has(key)) {
            const df = pendingMap.get(key)!;
            data.type === EMessageType.RESPONSE_EXCEPTION ? df.reject(new Error(data.data)) : df.resolve(data.data);
          }
          break;
        }
      }
    }
  };

  async sendMessageWithOutResponse(
    message:
      | (Omit<IMessageCallData, 'channel' | 'id'> & { id?: number })
      | (Omit<IMessageResponseData, 'channel' | 'id'> & { id?: number })
  ) {
    this.option.sendMessage({
      ...message,
      id: message.id,
    });
  }

  async sendMessageWithResponse(
    message: Omit<IMessageCallData, 'channel' | 'id'> | Omit<IMessageResponseData, 'channel' | 'id'>,
    option: {
      timeout?: number;
    }
  ) {
    const m = {
      id: ++this.messageId,
      channel: this.channel,
      ...message,
    };
    const df = defer(option.timeout);

    this.option.sendMessage(m);

    const pendingId = `${this.channel}-${this.messageId}`;
    if (this.pendingMap.has(pendingId)) {
      throw new Error('message has exists!');
    } else {
      this.pendingMap.set(`${this.channel}-${this.messageId}`, df);
      df.promise.finally(() => {
        this.pendingMap.delete(pendingId);
      });
    }

    return df.promise;
  }
}
