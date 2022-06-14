import { test } from 'mocha';
import { expect } from 'chai';
import {
  checkReceiveIsMatchInitMessage,
  EHandshakeMessageTypeInit,
  EHandshakeMessageTypeRes,
  isHandshakeMessage,
  parseHandshakeMessage,
  sendHandshakeResponseMessage,
  sendInitMessage,
} from '../../src/util';
import { createDefer } from '../../src/util';

describe('#handshake message test util', () => {
  test('#sendInitMessage should return string', () => {
    expect(sendInitMessage()).to.be.a('string');
  });

  test('#isHandshakeMessage should return false', () => {
    expect(isHandshakeMessage('')).to.be.false;
    expect(isHandshakeMessage('abc')).to.be.false;
    expect(isHandshakeMessage({})).to.be.false;
    expect(isHandshakeMessage(undefined!)).to.be.false;
  });

  test('#isHandshakeMessage should return true', () => {
    expect(isHandshakeMessage(sendInitMessage())).to.be.true;
    expect(isHandshakeMessage(sendInitMessage(undefined, undefined, false))).to.be.true;
    expect(isHandshakeMessage(sendHandshakeResponseMessage(sendInitMessage()))).to.be.true;
  });

  test('#parseHandshakeMessage should return undefined', () => {
    expect(parseHandshakeMessage('')).to.be.undefined;
    expect(parseHandshakeMessage({} as any)).to.be.undefined;
  });

  test('#parseHandshakeMessage should return correct value', () => {
    const initMessage = sendInitMessage();
    const result = parseHandshakeMessage(initMessage)!;
    expect(result).to.be.a('object');
    expect(result.type).to.be.eq(EHandshakeMessageTypeInit);
    expect(result.base).to.be.an('number');
    expect(result.offset).to.be.an('number');
    const responseMessage = sendHandshakeResponseMessage(initMessage);
    const responseMessageResult = parseHandshakeMessage(responseMessage)!;
    expect(responseMessageResult.type).to.be.eq(EHandshakeMessageTypeRes);
    expect(responseMessageResult.base).to.be.an('number');
    expect(responseMessageResult.offset).to.be.an('number');
  });

  test('#sendHandshakeResponseMessage should return string', () => {
    const initMessage = sendInitMessage();
    const responseMessage = sendHandshakeResponseMessage(initMessage);
    expect(responseMessage).to.be.an('string');
  });

  test('#checkReceiveIsMatchInitMessage should return false', () => {
    expect(checkReceiveIsMatchInitMessage('', '')).to.be.false;
  });

  test('#checkReceiveIsMatchInitMessage should return true', () => {
    const initMessage = sendInitMessage();
    const responseMessage = sendHandshakeResponseMessage(initMessage);
    expect(checkReceiveIsMatchInitMessage(initMessage, responseMessage)).to.be.true;
    expect(checkReceiveIsMatchInitMessage(initMessage, responseMessage, 100)).to.be.true;
    expect(checkReceiveIsMatchInitMessage(initMessage, responseMessage, -100)).to.be.false;
    const responseMessage1 = sendHandshakeResponseMessage(responseMessage);
    expect(checkReceiveIsMatchInitMessage(initMessage, responseMessage1)).to.be.false;
    expect(checkReceiveIsMatchInitMessage(responseMessage, responseMessage1)).to.be.true;
  });

  test('#checkReceiveIsMatchInitMessage should return true', async () => {
    const initMessage = sendInitMessage();
    const delay = 100;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await createDefer(delay).promise.catch((e) => {});
    const responseMessage = sendHandshakeResponseMessage(initMessage);
    expect(checkReceiveIsMatchInitMessage(initMessage, responseMessage)).to.be.true;
    expect(checkReceiveIsMatchInitMessage(initMessage, responseMessage, delay - 10)).to.be.false;
    expect(checkReceiveIsMatchInitMessage(initMessage, responseMessage, delay + 10)).to.be.true;
  });
});
