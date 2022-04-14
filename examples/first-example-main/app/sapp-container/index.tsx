import { Button, Card } from 'antd';
import React, { memo, useRef } from 'react';
import './index.less';
import { IAppInfo } from '../../store';
import { master } from '../../master';

export interface ISappContainerProps {
  app: IAppInfo;
}

export function SappContainer(props: ISappContainerProps) {
  const ref = useRef<any>();

  const exit = () => {
    const sessions = master.getSession(props.app.id);
    sessions.map((s) => {
      return s.disconnect();
    });
  };

  const title = (
    <div>
      小程序
      <Button size={'small'} className="fr" disabled={!props.app.isReady} onClick={exit}>
        退出
      </Button>
    </div>
  );

  return (
    <Card
      className="sapp-container-wrap"
      title={title}
      style={{ width: '300px', height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1 }}
    >
      <div className="sapp-container" ref={ref}>
        <iframe className="sapp-frame" src={props.app.url} frameBorder="0" />
      </div>
    </Card>
  );
}

export default memo(SappContainer);
