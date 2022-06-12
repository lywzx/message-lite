import { test } from 'mocha';
import { expect } from 'chai';
import { createPort, parsePort } from '../../src/util/session-port';

describe('#SessionPort test util', () => {
  test('#createPort should return string', async () => {
    expect(createPort('name', 1, 2)).to.be.a('string');
  });

  test('#parsePort should return string', async () => {
    const option = {
      name: 'test-name',
      port1: 2,
      port2: 2,
    };
    const portString = createPort(option.name, option.port1, option.port2);
    expect(parsePort(portString)).to.be.eqls(option);
  });
});
