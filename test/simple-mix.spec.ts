import { createSimpleMixClient } from './test-util/message-client';
import { test } from 'mocha';
import './test-util/promise-chai';
import { expect } from 'chai';
import { sleep } from './test-util/sleep';

describe('#simple-mix test util', () => {
  test('#test connect', async function () {
    const { mClient, sClient } = createSimpleMixClient();
    await Promise.all([mClient.waitConnect({}), sClient.connect({})]);

    await expect(mClient.opened).to.be.eventually.eq(undefined);
    await expect(sClient.opened).to.be.eventually.eq(undefined);
  });

  test('#test discount', async function () {
    const { mClient, sClient } = createSimpleMixClient();
    await Promise.all([mClient.waitConnect({}), sClient.connect({})]);

    await mClient.disconnect();
    await sleep(50);

    await expect(mClient.closed).to.be.eventually.eq(undefined);
    await expect(sClient.closed).to.be.eventually.eq(undefined);
  });
});
