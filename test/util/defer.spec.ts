import { test } from 'mocha';
import { expect, use } from 'chai';
import { defer } from '../../src/util';
import { isFunction } from 'lodash';
import chaiAsPromised from 'chai-as-promised';
use(chaiAsPromised);

describe('#defer test util', () => {
  test('test defer object', () => {
    const d = defer();
    const d1 = defer(200);
    [d, d1].forEach(function (value, index, array) {
      expect(value.promise).to.be.a('promise');
      expect(isFunction(value.reject)).to.be.true;
      expect(isFunction(value.resolve)).to.be.true;
    });
  });

  test('test defer will reject when timeout', async () => {
    const d = defer(200);
    await expect(d.promise).to.be.rejectedWith();
  });

  test('test defer will resolve', async () => {
    const d = defer(200);
    d.resolve(100);
    await expect(d.promise).to.be.eventually.equals(100);
  });
});
