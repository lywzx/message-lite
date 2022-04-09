import React, { useEffect, useState } from 'react';
import Layout from 'antd/lib/layout';
import { SappContainer } from './sapp-container';
import { master } from '../master';
import { EventName } from 'message-lite';
import Button from 'antd/lib/button';
import Space from 'antd/lib/space';
import {CHILD_FIRST_APP_ID} from "../constants";
import {Counter} from "../store";

export interface ISappInState {
  id: string;
}

export function App() {
  const [apps, setApps] = useState<ISappInState[]>([{ id: '1' }]);
  const [asyncApp, setAsyncApp] = useState<Sapp>();


  useEffect(() => {
    master.on(EventName.CONNECTED_FAILED, (data: any) => {});
  }, []);

  return (
    <Counter.Provider>
      <Layout className="app-layout">
        <Layout.Sider theme={'light'} className="app-layout-left">
          <a href="/">返回</a>
          <h2>主应用</h2>
          <Space direction="vertical">
            <Button type="primary" onClick={bootstrapMiniApp.bind(null, CHILD_FIRST_APP_ID)}>
              打开小程序1
            </Button>
            <div>异步应用</div>
            <div id="async-app"></div>
          </Space>
        </Layout.Sider>
        <Layout.Content className="app-layout-content">
          {apps.map((app) => {
            // eslint-disable-next-line react/jsx-no-undef
            return <SappContainer key={app.id} app={app} />;
          })}
        </Layout.Content>
      </Layout>
    </Counter.Provider>
  );
}
