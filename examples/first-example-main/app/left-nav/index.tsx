import { ALL_APP_INFOS } from '../../constants';
import Button from 'antd/lib/button';
import Space from 'antd/lib/space';
import React from 'react';
import { AppStore } from '../../store';

export function LeftNav() {
  const { addNewApp, appState } = AppStore.useContainer();

  return (
    <Space direction="vertical">
      {ALL_APP_INFOS.map((info, idx) => {
        const current = appState.list.find((app) => app.id === info.id);
        return (
          <Button
            type="primary"
            key={idx}
            disabled={!!current}
            onClick={() =>
              addNewApp({
                id: info.id,
                url: info.url,
                isReady: false,
              })
            }
          >
            打开小程序{idx + 1}
          </Button>
        );
      })}
      <div>异步应用</div>
      <div id="async-app"></div>
    </Space>
  );
}
