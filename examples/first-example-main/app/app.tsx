import { AlertService } from '@example/first-children-decl';
import React, { useState } from 'react';
import { Button, Layout, message, Space } from 'antd';
import { CHILD_FIRST_APP_ID, CHILD_SECOND_APP_ID, EXAMPLE_ASYNC_APP_ID } from '../constants';
import SappContainer from './sapp-container';
import { findIndex } from 'lodash';
import { MessageService } from '@example/first-example-parent-decl';

export interface ISappInState {
  id: string;
}

export function App() {
  const [apps, setApps] = useState<ISappInState[]>([]);
  const [asyncApp, setAsyncApp] = useState<Sapp>();


  const onClick = async () => {
    const service = sappMGR.getApp(CHILD_FIRST_APP_ID).getServiceUnsafe(AlertService);
    await service.alert('show alert!');
  };

  const closeSelf = () => {
    sappMGR.closeHost();
  };

  const hostTips = () => {
    const service = sappMGR.getHost()!.getServiceUnsafe(MessageService);
    service.info('Hello Host!');
  };

  const firstAppIsOpened = findIndex(apps, { id: CHILD_FIRST_APP_ID }) !== -1;

  return (
    <Layout className="app-layout">
      <Layout.Sider theme={'light'} className="app-layout-left">
        <a href="/">返回</a>
        <h2>主应用</h2>
        <Space direction="vertical">
          {sappMGR.isInHostEnv() && (
            <Button type="primary" onClick={closeSelf}>
              关闭自己
            </Button>
          )}
          {sappMGR.isInHostEnv() && (
            <Button type="primary" onClick={hostTips}>
              Host中弹出提示
            </Button>
          )}
          <Button disabled={firstAppIsOpened} type="primary" onClick={bootstrapMiniApp.bind(null, CHILD_FIRST_APP_ID)}>
            打开小程序1
          </Button>

          {firstAppIsOpened && <Button onClick={onClick}>调用小程序1的方法</Button>}

          <Button
            disabled={findIndex(apps, { id: CHILD_SECOND_APP_ID }) !== -1}
            type="primary"
            onClick={bootstrapMiniApp.bind(null, CHILD_SECOND_APP_ID)}
          >
            打开小程序2
          </Button>
          <Button type="primary" onClick={asyncApp ? unBootstrapAsyncApp : bootstrapAsyncApp}>
            {asyncApp ? '关闭异步应用' : '打开异步应用'}
          </Button>
          <div>异步应用</div>
          <div id="async-app"></div>
        </Space>
      </Layout.Sider>
      <Layout.Content className="app-layout-content">
        {apps.map((app) => {
          return <SappContainer key={app.id} app={app} />;
        })}
      </Layout.Content>
    </Layout>
  );
}
