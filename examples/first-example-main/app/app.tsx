import React, { useEffect } from 'react';
import Layout from 'antd/lib/layout';
import { AppStore } from '../store';
import { LeftNav } from './left-nav';
import { AppRoot } from './app-root';
import { master } from '../master';
import { EventName } from 'message-lite';
import { ConnectSession } from 'message-lite';

function AppLayout() {
  const { updateAppReady, removeApp } = AppStore.useContainer();

  useEffect(() => {
    master.on(EventName.CONNECTED, (session: ConnectSession) => {
      const name = session.getName();
      updateAppReady(name);
    });

    master.on(EventName.CONNECTED_FAILED, (session: ConnectSession) => {
      const name = session.getName();
      removeApp(name);
    });

    return () => {
      master.off(EventName.CONNECTED);
      master.off(EventName.CONNECTED_FAILED);
    };
  }, []);

  return (
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
  );
}

export function App() {
  return (
    <AppStore.Provider>
      <AppLayout />
    </AppStore.Provider>
  );
}
