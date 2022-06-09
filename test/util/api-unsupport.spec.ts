import { test } from 'mocha';
import chaiAsPromised from 'chai-as-promised';
import { expect, use } from 'chai';
import { ApiUnSupport } from '../../src';
use(chaiAsPromised);

describe('#ApiUnSupport test util', () => {
  test('ApiUnSupport should throw exception', async () => {
    await expect(ApiUnSupport()).to.be.rejectedWith(Error, 'api is not impl!');
  });
});
