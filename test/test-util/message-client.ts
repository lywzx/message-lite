import { EventEmitter, MasterClient, MessageContext, SlaveClient, WILL_CONNECT } from '../../src/libs';
import { IMessageBaseData } from '../../src/interfaces';
import { parsePort } from '../../src/util';

export function createMasterSlaveClient(name: string) {
  const commonEvent = new EventEmitter();
  const slaveEventName = 'slave-event';
  const masterEventName = 'master-event';
  const slaveClient = new SlaveClient(name, new EventEmitter());
  const masterClient = new MasterClient(name, new EventEmitter());
  const lifeCircleEvent = new EventEmitter();

  const slaveMessageContext = new MessageContext({
    listenMessage(fn: (message: any) => void): void {
      commonEvent.on(slaveEventName, fn);
    },
    unListenMessage(fn: (message: any) => void): void {
      commonEvent.off(slaveEventName, fn);
    },
  });
  const masterMessageContext = new MessageContext({
    listenMessage(fn: (message: any) => void): void {
      commonEvent.on(masterEventName, fn);
    },
    unListenMessage(fn: (message: any) => void): void {
      commonEvent.off(masterEventName, fn);
    },
  });
  masterMessageContext.start();
  masterMessageContext.on(WILL_CONNECT, async (message: IMessageBaseData) => {
    masterClient.initSender((...args: any[]) => commonEvent.emit(slaveEventName, ...args));
    const info = parsePort(message.channel);
    await masterClient.connect({
      message: message.data,
      remotePort: info.port1,
      messageContext: masterMessageContext,
      lifeCircleEvent,
    });
  });
  slaveClient.initSender((...args: any[]) => commonEvent.emit(masterEventName, ...args));
  slaveClient.connect({
    messageContext: slaveMessageContext,
  });

  return {
    slaveEventName,
    masterEventName,
    slaveClient,
    slaveMessageContext,
    masterMessageContext,
    masterClient,
    lifeCircleEvent,
    commonEvent,
  };
}
