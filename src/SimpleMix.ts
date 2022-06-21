import { BasicServer, WILL_CONNECT } from './libs';
import { Class } from './types';
import { MBaseService } from './service/m-base-service';
import { IConnectSession, IMessageBaseData, IMessageConfig, IMessageHandshakeData, ITimeout } from './interfaces';
import {
  checkReceiveIsMatchInitMessage,
  createDefer,
  EHandshakeMessageTypeInit,
  parseHandshakeMessage,
  parsePort, sendInitMessage,
  throwException
} from './util';
import { SimpleClient } from './libs/client/simple-client';
import { getDefer, setDefer } from './service';
import { EMessageTypeHandshake } from './constant';

/**
 * 连接配置信息
 */
export interface IClientConnectOption extends ITimeout {
  name: string;
  ports?: [number, number],
}

const DEFAULT_PORTS = [999, 888];

export class SimpleMix extends BasicServer {

  protected session!: IConnectSession;

  protected _allowCall = false;

  protected _connectOption: IClientConnectOption;

  constructor(protected readonly option: IMessageConfig) {
    super(option);
  }

  getService<T extends MBaseService>(serv: Class<T>): T | undefined {
    return this.session.getService(serv);
  }

  private whenNewClientConnected = (message: IMessageHandshakeData, originMessage: any) => {
    const {
      session,
      option,
    } = this;
    if (!session) {
      return ;
    }
    const defer = getDefer(this.session)!;
    if (!defer) {
      return ;
    }

    const { channel, data } = message;
    const parsedHandshake = parseHandshakeMessage(data);
    if (!parsedHandshake || parsedHandshake.type !== EHandshakeMessageTypeInit) {
      return;
    }
    const {
      ports = DEFAULT_PORTS,
      timeout = 3000
    } = this._connectOption!;
    const info = parsePort(channel);

    if (info.name === session.getName() && info.port1 === ports[0] && info.port2 === ports[1]) {
      session.port1 = ports[1];
      session.port2 = ports[0];
      session.initSender(option.createSender(originMessage));
      (session as SimpleClient).connect({
        timeout,
        message: data,
      }).then(() => defer.resolve()).catch(e => defer.reject(e));
    }
  };

  public async connect(option: IClientConnectOption): Promise<void> {
    if (this._allowCall) {
      throwException('client cannot repeat connect!');
    }
    const {
      ports = DEFAULT_PORTS,
      name,
      timeout = 30000,
    } = option;
    const {
      messageContext,
    } = this;
    const sender = this.option.createSender();
    const session = (this.session = new SimpleClient(name, this));
    session.initSender(sender);

    session.port1 = ports[0];
    session.port2 = ports[1];
    messageContext.start();
    messageContext.attachSession(session);

    const initMessage = sendInitMessage();

    session.sendMessage({
      type: EMessageTypeHandshake,
      data: initMessage,
    });

    // 开始监听
    let waitConnect = (message: IMessageBaseData, messageOrigin: any) => {
      // nowork
    };
    return Promise.race([
        new Promise((resolve) => {
          waitConnect = (message: IMessageBaseData, messageOrigin: any) => {
            const res = message.data || '';
            if (checkReceiveIsMatchInitMessage(initMessage, res)) {
              resolve(message);
            }
          };
          messageContext.on(WILL_CONNECT, waitConnect);
        }),
        createDefer(timeout, (timeout) => new Error('slave connect timeout.')).promise,
      ]).then(() => undefined).finally(() => {
        messageContext.off(WILL_CONNECT, waitConnect);
      });
  }

  public async waitConnect(option: IClientConnectOption): Promise<void> {
    if (this._allowCall) {
      throwException('client cannot repeat connect!');
    }

    this._connectOption = option;
    const {
      timeout = 30000,
    } = option;
    const {
      messageContext
    } = this;

    const session = (this.session = new SimpleClient(option.name, this));

    const defer = createDefer<void>(timeout);
    this.messageContext.start();
    messageContext.on(WILL_CONNECT, this.whenNewClientConnected);

    setDefer(session, defer);

    return defer.promise.finally(() => {
      messageContext.off(WILL_CONNECT, this.whenNewClientConnected);
    });
  }

  public async disconnect() {}
}
