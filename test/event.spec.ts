import { test } from 'mocha';
import { expect } from 'chai';
import { EventEmitter, EventOff, EventOffAll, EventOn } from '../src/libs';
import { fake } from 'sinon';

describe('#event test impl', () => {
  const eventName = 'testEventName';

  test('test event constructor', () => {
    expect(new EventEmitter()).to.be.instanceof(EventEmitter);
  });

  test('test event on is trigger when emit', () => {
    const evt = new EventEmitter();
    const fn = fake();
    evt.on(eventName, fn);

    evt.emit(eventName, 'a');
    expect(fn.calledOnce).to.be.true;
    expect(fn.firstCall.args).to.be.eql(['a']);
    evt.emit(eventName, 'b', 'c');
    expect(fn.calledTwice).to.be.true;
    expect(fn.secondCall.args).to.be.eql(['b', 'c']);
  });

  test('test fn on twice, only trigger once', () => {
    const evt = new EventEmitter();
    const fn = fake();
    evt.on(eventName, fn);
    evt.on(eventName, fn);
    evt.emit(eventName, 'a');
    expect(fn.calledOnce).to.be.true;
    expect(fn.firstCall.args).to.be.eql(['a']);
  });

  test('test fn on and once, will trigger twice', () => {
    const evt = new EventEmitter();
    const fn = fake();
    evt.on(eventName, fn);
    evt.once(eventName, fn);
    evt.emit(eventName, 'a');
    expect(fn.calledTwice).to.be.true;
    expect(fn.firstCall.args).to.be.eql(['a']);
    expect(fn.secondCall.args).to.be.eql(['a']);
  });

  test('test event once should call once when emit many times', () => {
    const evt = new EventEmitter();
    const fn = fake();
    evt.once(eventName, fn);

    evt.emit(eventName, 'a');
    evt.emit(eventName, 'b');

    expect(fn.calledOnce).to.be.true;
    expect(fn.firstCall.args).to.be.eql(['a']);

    evt.once(eventName, fn);
    evt.emit(eventName, 'c');
    expect(fn.calledTwice).to.be.true;
    expect(fn.secondCall.args).to.be.eql(['c']);
  });

  test('test event should correct trigger event', () => {
    const evt = new EventEmitter();
    const fn = fake();
    const fn1 = fake();
    const evtName = 'fn';
    const evtName1 = 'fn1';
    evt.on(evtName, fn);
    evt.on(evtName1, fn1);
    evt.emit(evtName, 'a', 'b');
    expect(fn.calledOnce).to.be.true;
    expect(fn1.calledOnce).to.be.false;
    evt.emit(evtName1, 'b', 'a');
    expect(fn.calledOnce).to.be.true;
    expect(fn1.calledOnce).to.be.true;
  });

  test('test event off will work', () => {
    const evt = new EventEmitter();
    const fn = fake();
    evt.on(eventName, fn);

    evt.emit(eventName, 'a');
    evt.off(eventName);
    evt.emit(eventName, 'b');

    expect(fn.calledOnce).to.be.true;
    expect(fn.firstCall.args).to.be.eql(['a']);
  });

  test('test event off assign fn will work', () => {
    const evt = new EventEmitter();
    const fn1 = fake();
    const fn2 = fake();
    evt.on(eventName, fn1);
    evt.on(eventName, fn2);

    evt.emit(eventName, 'a');
    evt.off(eventName, fn1);
    evt.emit(eventName, 'b');

    expect(fn1.calledOnce).to.be.true;
    expect(fn2.firstCall.args).to.be.eql(['a']);
    expect(fn2.secondCall.args).to.be.eql(['b']);
  });

  test('test event off when once or on', () => {
    const fn1 = fake();
    const evt = new EventEmitter();
    evt.on(eventName, fn1);
    evt.once(eventName, fn1);
    evt.emit(eventName, 1);
    expect(fn1.calledTwice).to.be.true;
    evt.emit(eventName, 2);
    expect(fn1.calledThrice).to.be.true;
    evt.once(eventName, fn1);
    evt.off(eventName, fn1, true);
    evt.emit(eventName, 3);
    expect(fn1.callCount).to.be.eq(4);
    evt.off(eventName, fn1, false);
    evt.emit(eventName, 4);
    expect(fn1.callCount).to.be.eq(4);
    evt.on(eventName, fn1);
    evt.once(eventName, fn1);
    evt.off(eventName, fn1);
    evt.emit(eventName, 5);
    expect(fn1.callCount).to.be.eq(4);
  });

  test('test event many fn, will trigger', () => {
    const evt = new EventEmitter();
    const times = Array.from({
      length: 10,
    }).map(() => {
      return fake();
    });
    times.forEach((fn) => {
      evt.on(eventName, fn);
    });
    evt.emit(eventName);
    times.forEach((fn) => {
      expect(fn.calledOnce).to.be.true;
    });
    evt.emit(eventName);
    times.forEach((fn) => {
      expect(fn.calledTwice).to.be.true;
    });
  });

  test('test event dispose will reset', () => {
    const evt = new EventEmitter();
    const fn1 = fake();
    evt.on(eventName, fn1);
    evt.dispose();
    evt.emit(eventName, '1');
    expect(fn1.called).to.be.false;
  });

  test('test event on event will correct trigger', () => {
    const evt = new EventEmitter();
    const fn = fake();
    const fn1 = fake();
    let listener = 0;
    evt.on(EventOn, () => {
      listener++;
    });
    evt.on(EventOff, () => {
      listener--;
    });
    evt.on(EventOffAll, fn1);
    evt.on(eventName, fn);
    expect(listener).to.be.eql(1);
    evt.once(eventName, fn);
    expect(listener).to.be.eql(2);
    evt.off(eventName);
    expect(listener).to.be.eql(0);

    evt.on(eventName, fn);
    evt.once(eventName, fn);
    expect(listener).to.be.eql(2);
    evt.emit(eventName, 1);
    expect(listener).to.be.eql(1);
    evt.off(eventName);
    expect(listener).to.be.eql(0);
    expect(fn1.calledTwice).to.be.true;
  });
});
