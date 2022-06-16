import { IConnectSession, IMessageConfig, IMessageHandshakeData } from './interfaces';
import { Class } from './types';
import { BasicServer, WILL_CONNECT, MasterClient, EventEmitter } from './libs';
import {
  createMasterService,
  EHandshakeMessageTypeInit,
  parseHandshakeMessage,
  throwException,
  parsePort,
} from './util';
import { DISCONNECT } from './constant';

export class Master extends BasicServer {
  protected serviceMap = new Map();

  constructor(protected readonly option: IMessageConfig) {
    super(option);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getService<T>(serv: Class<T>): T | undefined {
    if (!this.started) {
      throwException('master not started, get service failed!');
    }
    let service = this.serviceMap.get(serv);
    if (!service) {
      service = createMasterService(this.messageContext, serv);
      this.serviceMap.set(serv, service);
    }
    return service!;
  }

  protected whenNewClientConnected = async (message: IMessageHandshakeData, originMessage: any) => {
    const { messageContext, option } = this;

    const { channel, data } = message;
    const parsedHandshake = parseHandshakeMessage(data);
    if (!parsedHandshake || parsedHandshake.type !== EHandshakeMessageTypeInit) {
      return;
    }
    const info = parsePort(channel);
    const session = new MasterClient(info.name, new EventEmitter());
    session.initSender(option.createSender(originMessage));

    await session.connect({
      message: data,
      remotePort: info.port1,
      messageContext,
      lifeCircleEvent: this,
    });

    session.closed.finally(() => {
      this.emit(DISCONNECT, session);
    });
  };

  async start(): Promise<void> {
    if (this.started) {
      throwException('serve has been started!');
    }
    this.started = true;
    const messageContext = this.messageContext;
    messageContext.start();
    messageContext.on(WILL_CONNECT, this.whenNewClientConnected);
  }

  async stop(): Promise<void> {
    this.started = false;
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
