import React from 'react';
import Layout from 'antd/lib/layout';
import { AppStore } from '../store';
import { LeftNav } from './left-nav';
import { AppRoot } from './app-root';

export interface ISappInState {
  id: string;
}

export function App() {
  /*useEffect(() => {
    master.on(EventName.CONNECTED_FAILED, (data: any) => {
    });
  }, []);*/

  return (
    <AppStore.Provider>
      <Layout className="app-layout">
        <Layout.Sider theme={'light'} className="app-layout-left">
          <a href="/">返回</a>
          <h2>主应用</h2>
          <LeftNav />
        </Layout.Sider>
        <Layout.Content className="app-layout-content">
          <AppRoot />
        </Layout.Content>
      </Layout>
    </AppStore.Provider>
  );
}
