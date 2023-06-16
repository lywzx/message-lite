import { ALL_APP_INFOS } from '../../constants';
import Button from 'antd/lib/button';
import Space from 'antd/lib/space';
import React, { Fragment, MouseEvent, useRef, useState } from 'react';
import { AppStore } from '../../store';
import './index.less';
import { master } from '../../master';
import { first } from 'lodash';
import { AlertService, PageEventService } from '@example/first-children-decl';

export function LeftNav() {
  const { addNewApp, appState } = AppStore.useContainer();
  const [currentClicked, updateClicked] = useState<null | { x: number; y: number }>(null);
  const ref = useRef<null | (() => any)>();

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

          const watchPageClick = (e: MouseEvent) => {
            e.preventDefault();
            const app = first(master.getSession(current.id))!;
            const service = app.getService(PageEventService);
            ref.current = service.onPageClientPos.on((pos) => {
              updateClicked(pos);
            });
            updateClicked({ x: 0, y: 0 });
          };
          const unWatchPageClick = (e: MouseEvent) => {
            e.preventDefault();
            if (ref.current) {
              ref.current();
              ref.current = null;
            }
            updateClicked(null);
          };
          appService = (
            <ul className="app-child-api">
              <li>
                <a href="" onClick={alertInfo}>
                  打印消息
                </a>
              </li>
              <li>
                <a href="" onClick={currentClicked ? unWatchPageClick : watchPageClick}>
                  {currentClicked ? '取消监听' : '监听页面点击'}
                </a>
              </li>
              {currentClicked && (
                <li>
                  点击位置为, x: {currentClicked.x}; y: {currentClicked.y}
                </li>
              )}
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
