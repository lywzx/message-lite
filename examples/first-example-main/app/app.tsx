import React, { useEffect } from 'react';
import Layout from 'antd/lib/layout';
import { AppStore } from '../store';
import { LeftNav } from './left-nav';
import { AppRoot } from './app-root';
import { master } from '../master';
import { CONNECTED, CONNECTED_FAILED, IConnectSession } from 'message-lite';
import { ScreenService } from '@example/first-example-decl';

function AppLayout() {
  const { updateAppReady, removeApp } = AppStore.useContainer();

  useEffect(() => {
    master.on(CONNECTED, (session: IConnectSession) => {
      const name = session.getName();
      updateAppReady(name);
    });

    master.on(CONNECTED_FAILED, (session: IConnectSession) => {
      const name = session.getName();
      removeApp(name);
    });

    const service = master.getService(ScreenService)!;
    const listenResize = (evt: UIEvent) => {
      console.log((evt.currentTarget as Window).innerWidth, (evt.currentTarget as Window).innerHeight);
      service.watcher.emit({
        width: (evt.currentTarget as Window).innerWidth,
        height: (evt.currentTarget as Window).innerHeight,
      });
    };

    window.addEventListener('resize', listenResize, false);
    return () => {
      master.off(CONNECTED);
      master.off(CONNECTED_FAILED);
      window.removeEventListener('resize', listenResize, false);
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
