import { Message2Service, MessageService } from '@example/first-example-decl';
import Button from 'antd/lib/button';
import Row from 'antd/lib/row';
import React from 'react';
import { slave } from '../slave';

export function App() {
  const showMessage = async () => {
    const message = slave.getService(MessageService);
    await message!.info({
      waitingClose: true,
      duration: 6,
      content: '点击弹出成功！',
    });
  };

  const showMessage2 = async () => {
    const message = slave.getService(Message2Service);
    await message!.info('点击弹出成功！');
  };

  const showMessage3 = async () => {
    const message = slave.getService(Message2Service);
    await message!.info2('点击弹出成功！');
  };

  return (
    <Row>
      <Button onClick={showMessage}>message1提示信息</Button>
      <Button onClick={showMessage2}>message2提示信息</Button>
      <Button onClick={showMessage3}>message2提示信息info2</Button>
    </Row>
  );
}
