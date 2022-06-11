import { IConnectSession, IMessageConfig, IMessageHandshakeData } from './interfaces';
import { Class } from './types';
import { BasicServer, WILL_CONNECT, WILL_DISCOUNT, MasterClient, EventEmitter } from './libs';
import { createMasterService, EHandshakeMessageType, parseHandshakeMessage, throwException, parsePort } from './util';

export class Master extends BasicServer {
  constructor(protected readonly option: IMessageConfig) {
    super(option);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getService<T>(serv: Class<T>): T | undefined {
    if (!this.started) {
      throwException('master not started, get service failed!');
    }
    return createMasterService(this.messageContext, serv);
  }

  protected whenNewClientConnected = async (message: IMessageHandshakeData, originMessage: any) => {
    const { messageContext, option } = this;

    const { channel, data } = message;
    const parsedHandshake = parseHandshakeMessage(data);
    if (!parsedHandshake || parsedHandshake.type !== EHandshakeMessageType.INIT) {
      return;
    }
    const info = parsePort(channel);
    const session = new MasterClient(info.name, new EventEmitter());
    session.initSender(option.createSender(originMessage));

    return session.connect({
      message: data,
      remotePort: info.port1,
      messageContext,
      lifeCircleEvent: this,
    });
  };

  protected whenClientWillDisConnected = (message: any) => {
    //
    message = 1;
  };

  async start(): Promise<void> {
    if (this.started) {
      throwException('serve has been started!');
    }
    this.started = true;
    const messageContext = this.messageContext;
    messageContext.start();
    messageContext.on(WILL_CONNECT, this.whenNewClientConnected);
    messageContext.on(WILL_DISCOUNT, this.whenClientWillDisConnected);
  }

  async stop(): Promise<void> {
    this.started = false;
    this.messageContext.dispose();
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    this.messageContext.dispose();
  }

  public getSession(name?: string): Array<IConnectSession> {
    if (!this.started) {
      throwException('app not started');
    }
    const sessions = Array.from(this.messageContext.getSession()).map(([channel, session]) => session);

    if (name) {
      return sessions.filter((s) => s.getName() === name);
    }

    return sessions;
  }
}
