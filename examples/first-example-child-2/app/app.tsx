import { MessageService } from '@example/first-example-decl';
import { Button, Row } from 'antd';
import React from 'react';
import { slave } from '../slave';
import { AppClient } from './AppClient';
import './index.less';

export function App() {
  const showMessage = async () => {
    const message = await slave.getService(MessageService);
    await message!.info('点击弹出成功！');
  };

  return (
    <>
      <div className="app-default-btn">
        <Row>
          <Button onClick={showMessage}>弹出提示信息！</Button>
        </Row>
      </div>
      <div className="app-client-container">
        <AppClient />
      </div>
    </>
  );
}
