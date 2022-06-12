import { test } from 'mocha';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { EventEmitter, MasterClient, MessageContext, SlaveClient, WILL_CONNECT } from '../src/libs';
import { IMessageBaseData } from '../src/interfaces';
import { fake } from 'sinon';
import { CONNECTED } from '../dist';
import { parsePort } from '../src/util';
use(chaiAsPromised);
import debug from 'debug';

const log = debug('app:message');

describe('#master-client', () => {
  test('#connecting test', async () => {
    const name = 'test-name';
    const commonEvent = new EventEmitter();
    const slaveEventName = 'slave-event';
    const masterEventName = 'master-event';
    const slaveClient = new SlaveClient(name, new EventEmitter());
    const masterClient = new MasterClient(name, new EventEmitter());
    const lifeCircleEvent = new EventEmitter();
    const fn1 = fake();
    lifeCircleEvent.on(CONNECTED, (data: any) => {
      fn1(data);
    });

    commonEvent.on(slaveEventName, (...args) => {
      log('slave-event-receive', ...args);
    });

    commonEvent.on(masterEventName, (...args) => {
      log('master-event-receive', ...args);
    });

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
    masterMessageContext.on(WILL_CONNECT, (message: IMessageBaseData) => {
      masterClient.initSender((...args: any[]) => commonEvent.emit(slaveEventName, ...args));
      const info = parsePort(message.channel);
      masterClient.connect({
        message: message.data,
        remotePort: info.port1,
        messageContext: masterMessageContext,
        lifeCircleEvent,
      });
    });

    slaveClient.initSender((...args: any[]) => commonEvent.emit(masterEventName, ...args));
    await slaveClient.connect({
      messageContext: slaveMessageContext,
    });
    await masterClient.opened;
    // console.log('calledCount', fn1.callCount);
    expect(fn1.calledOnce).to.be.true;
    expect(fn1.firstCall.firstArg).to.be.eq(masterClient);
  });
});
