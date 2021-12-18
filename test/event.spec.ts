import { test } from 'mocha';
import { expect } from 'chai';
import { Event } from '../src/libs';
import { fake } from 'sinon';

describe('#event test impl', () => {
  const eventName = 'testEventName';

  test('test event constructor', () => {
    expect(new Event()).to.be.instanceof(Event);
  });

  test('test event on is trigger when emit', () => {
    const evt = new Event();
    const fn = fake();
    evt.on(eventName, fn);

    evt.emit(eventName, 'a');
    expect(fn.calledOnce).to.be.true;
    expect(fn.firstCall.args).to.be.eql(['a']);
    evt.emit(eventName, 'b');
    expect(fn.calledTwice).to.be.true;
    expect(fn.secondCall.args).to.be.eql(['b']);
  });

  test('test event once should call once when emit many times', () => {
    const evt = new Event();
    const fn = fake();
    evt.once(eventName, fn);

    evt.emit(eventName, 'a');
    evt.emit(eventName, 'b');

    expect(fn.calledOnce).to.be.true;
    expect(fn.firstCall.args).to.be.eql(['a']);
  });

  test('test event off will work', () => {
    const evt = new Event();
    const fn = fake();
    evt.on(eventName, fn);

    evt.emit(eventName, 'a');
    evt.off(eventName);
    evt.emit(eventName, 'b');

    expect(fn.calledOnce).to.be.true;
    expect(fn.firstCall.args).to.be.eql(['a']);
  });

  test('test event off assign fn will work', () => {
    const evt = new Event();
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

  test('test event many fn, will trigger', () => {
    const evt = new Event();
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
  });

  test('test event dispose will reset', () => {
    const evt = new Event();
    const fn1 = fake();
    evt.on(eventName, fn1);
    evt.dispose();
    evt.emit(eventName, '1');
    expect(fn1.called).to.be.false;
  });
});
