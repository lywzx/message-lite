import { ALL_APP_INFOS } from '../../constants';
import Button from 'antd/lib/button';
import Space from 'antd/lib/space';
import React, { Fragment, MouseEvent } from 'react';
import { AppStore } from '../../store';
import './index.less';
import { master } from '../../master';
import { first } from 'lodash';
import { AlertService } from '@example/first-children-decl';

export function LeftNav() {
  const { addNewApp, appState } = AppStore.useContainer();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {ALL_APP_INFOS.map((info, idx) => {
        const current = appState.list.find((app) => app.id === info.id);

        let appService = null;
        if (idx === 0 && current && current.isReady) {
          const alertInfo = async (e: MouseEvent) => {
            e.preventDefault();
            const app = first(master.getSession(current.id))!;
            const alertService = app.getService(AlertService);
            await alertService.alert({
              message: '测试消息',
              description: '提示消息',
            });
          };
          appService = (
            <ul className="app-child-api">
              <li>
                <a href="javascript:void" onClick={alertInfo}>打印消息</a>
              </li>
            </ul>
          );
        }

        return (
          <Fragment key={idx}>
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
            {appService}
          </Fragment>
        );
      })}
      <div>异步应用</div>
      <div id="async-app"></div>
    </Space>
  );
}
