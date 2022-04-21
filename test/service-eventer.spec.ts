import { describe } from 'mocha';
import { expect } from 'chai';
import { ServiceEventer } from '../src/libs';
import { fake } from 'sinon';

describe('test service-eventer', function () {
  it('test service-enenter constructor ', function () {
    expect(
      new ServiceEventer({
        eventName: 'test-event',
      })
    ).to.be.instanceof(ServiceEventer);
  });

  it('should throw error when event name is empty', function () {
    expect(() => {
      new ServiceEventer({
        eventName: ''
      });
    }).to.be.throw();
  });

  it('should correct trigger', function () {
    const evt = new ServiceEventer({
      eventName: '',
    });
    const fn1 = fake();
    const fn2 = fake();
    const fn3 = fake();
    const fn4 = fake();
    const fn5 = fake();
    const off1 = evt.once(fn1);
    evt.once(fn2);
    evt.on(fn3);
    const off3 = evt.on(fn3);
    evt.on(fn4);
    evt.on(fn5);
    off1();
    evt.emit('a');
    evt.emit('b');
    off3();
    evt.emit('c');
    evt.dispose();
    evt.emit('d');
    expect(fn1.called).to.be.false;
    expect(fn2.calledOnce).to.be.true;
    expect(fn3.calledTwice).to.be.true;
    expect(fn4.calledThrice).to.be.true;
    expect(fn5.calledThrice).to.be.true;
  });
});
