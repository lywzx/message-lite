import { test } from 'mocha';
import { expect } from 'chai';
import './test-util/promise-chai';
import { fake } from 'sinon';
import { CONNECTED } from '../dist';
import { createClient, createServe, GLOBAL_EVENT_NAME } from './test-util/message-client';
import debug from 'debug';
import { AppTestService } from './services/decl';
import { AppTestImpl } from './services/impl';
import { MasterClient } from '../src/libs';
import { sleep } from './test-util/sleep';

debug.enable('app:*');

const log = debug('app:message');

describe('#message-context client serve test util', () => {
  test('#connect testing util', async () => {
    const { master, globalEvent } = createServe();
    await master.start();
    const fn1 = fake();
    master.on(CONNECTED, fn1);
    globalEvent.on(GLOBAL_EVENT_NAME, (...args) => {
      log('master-event-receive data: %j', ...args);
    });

    const client1 = createClient(globalEvent);
    await expect(client1.connect({})).to.be.eventually.eq(undefined);

    expect(fn1.calledOnce).to.be.true;
    expect(fn1.firstCall.firstArg).to.be.instanceof(MasterClient);

    const client2 = createClient(globalEvent);
    await expect(client2.connect({})).to.be.eventually.eq(undefined);
    expect(fn1.calledTwice).to.be.true;
    expect(fn1.secondCall.firstArg).to.be.instanceof(MasterClient);
  });

  test('#server service should called correct', async () => {
    const { master, globalEvent } = createServe();
    master.addService([
      {
        decl: AppTestService,
        impl: AppTestImpl,
      },
    ]);
    await master.start();

    const client = createClient(globalEvent);
    await client.connect();
    const service = client.getService(AppTestService)!;
    expect(service.currentTime()).to.be.a('promise');
    expect(await service.currentTime()).to.be.a('number');
    const current = Date.now();
    await expect(service.currentTime(current)).to.eventually.eq(current + 1);
  });

  test('#server event should trigger correct', async () => {
    const { master, globalEvent } = createServe();
    master.addService([
      {
        decl: AppTestService,
        impl: AppTestImpl,
      },
    ]);
    await master.start();

    const testService = master.getService(AppTestService)!;

    const client = createClient(globalEvent);
    await client.connect();

    await sleep();

    const service = client.getService(AppTestService)!;

    const fn1 = fake();
    const off = service.event.on(fn1);
    await sleep();

    testService.event.emit(1);
    // wait message pass
    await sleep();
    expect(fn1.calledOnce).to.be.true;
    expect(fn1.firstCall.firstArg).to.be.eq(1);

    off();
    await sleep();
    testService.event.emit(2);
    expect(fn1.calledTwice).to.be.false;
  });

  test('#slave should called correct', async () => {
    const { master, globalEvent } = createServe();
    await master.start();

    const slave = createClient(globalEvent);
    slave.addService([
      {
        decl: AppTestService,
        impl: AppTestImpl,
      },
    ]);
    const slaveClientName = 'test-app';
    await slave.connect({
      name: slaveClientName,
    });

    await sleep();

    const masterCurrentSlave = master.getSession(slaveClientName)!;

    expect(masterCurrentSlave).to.be.an('array');
    expect(masterCurrentSlave).to.be.length(1);
    expect(masterCurrentSlave[0]).to.be.instanceof(MasterClient);
    const service = masterCurrentSlave[0].getService(AppTestService)!;

    expect(service.currentTime()).to.be.a('promise');
    expect(await service.currentTime()).to.be.a('number');
    const current = Date.now();
    await expect(service.currentTime(current)).to.eventually.eq(current + 1);
  });

  test('#master#getService should cached', async () => {
    const { master } = createServe();
    await master.start();

    const masterService = master.getService(AppTestService);

    expect(masterService).to.be.instanceof(AppTestService);
    expect(master.getService(AppTestService)).to.be.eq(masterService);
  });

  test('#slave#getService should cached', async () => {
    const { master, globalEvent } = createServe();
    await master.start();

    const slave = createClient(globalEvent);
    await slave.connect();
    const service = slave.getService(AppTestService);

    expect(service).to.be.instanceof(AppTestService);
    expect(slave.getService(AppTestService)).to.be.eq(service);
  });

  test('#getService should throw exception', async () => {
    const { master, globalEvent } = createServe();
    expect(() => master.getService(AppTestService)).to.be.throw(Error);

    const slave = createClient(globalEvent);
    expect(() => slave.getService(AppTestService)).to.be.throw(Error);
  });

  test('#repeat start or connect should throw exception', async () => {
    const { master, globalEvent } = createServe();
    await master.start();
    await expect(master.start()).to.be.rejectedWith(Error);

    const slave = createClient(globalEvent);
    await slave.connect();
    await expect(slave.connect()).to.be.rejectedWith(Error);
  });
});
