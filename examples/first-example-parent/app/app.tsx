import { MessageService } from '@example/first-example-decl';
import { Button, Layout, Space } from 'antd';
import React, { useRef } from 'react';
import './app.less';

export function App() {
  const ref = useRef<any>();

  const openApp = async () => {};

  const showMessage = async () => {};

  return (
    <Layout className="app-layout">
      <Layout.Sider theme={'light'} className="app-layout-left">
        <a href="/">返回</a>
        <h2>HOST环境</h2>
        <Space direction="vertical">
          <Button type="primary" onClick={openApp}>
            打开主应用
          </Button>
          <Button type="primary">退出主应用</Button>
        </Space>
        <h2>远程调用方法</h2>
        <Space direction="vertical">
          <Button onClick={showMessage}>主应用中弹出提示</Button>
        </Space>
      </Layout.Sider>
      <Layout.Content className="app-layout-content">
        <div ref={ref} className="app-framework-container"></div>
      </Layout.Content>
    </Layout>
  );
}
