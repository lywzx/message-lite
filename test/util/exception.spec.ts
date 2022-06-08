import { test } from 'mocha';
import { expect, use } from 'chai';
import { throwException, throwExceptionAsync } from '../../src/util';
import chaiAsPromised from 'chai-as-promised';
use(chaiAsPromised);

describe('#expection test util', () => {
  test('#throwException should throw exception', () => {
    expect(() => throwException('err')).to.be.throws(Error, 'err');
  });

  test('#throwExceptionAsync should throw exception', async () => {
    await expect(throwExceptionAsync('err')).to.be.rejectedWith(Error, 'err');
  });
});
