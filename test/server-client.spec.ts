import { test } from 'mocha';
import { expect } from 'chai';
import './test-util/promise-chai';
import { fake } from 'sinon';
import { CONNECTED } from '../dist';
import { createMasterSlaveClient } from './test-util/message-client';
import debug from 'debug';
import { addServices } from '../src/util';
import { AppTestService } from './services/decl';

debug.enable('app:*');

const log = debug('app:message');

describe('#message-context client serve test util', () => {
  test('#connect testing util', async () => {
    const name = 'test-name';
    const { slaveClient, masterClient, lifeCircleEvent, commonEvent, slaveEventName, masterEventName } =
      createMasterSlaveClient(name);

    const fn1 = fake();
    lifeCircleEvent.on(CONNECTED, (data: any) => {
      fn1(data);
    });

    commonEvent.on(slaveEventName, (...args) => {
      log('slave-event-receive data: %j', ...args);
    });

    commonEvent.on(masterEventName, (...args) => {
      log('master-event-receive data: %j', ...args);
    });

    await expect(slaveClient.opened).to.be.eventually.eq(undefined);
    await expect(masterClient.opened).to.be.eventually.eq(undefined);

    expect(fn1.calledOnce).to.be.true;
    expect(fn1.firstCall.firstArg).to.be.eq(masterClient);
  });

  test('#server should called correct', async () => {
    const { masterMessageContext } = createMasterSlaveClient('test-event');

    addServices(
      [
        {
          decl: AppTestService,
          impl: () => {
            return {};
          },
        },
      ],
      masterMessageContext
    );
  });
});
