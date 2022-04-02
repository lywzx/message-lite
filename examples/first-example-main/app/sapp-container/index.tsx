import { Button, Card, Modal } from 'antd';
import React, { memo, useEffect, useRef } from 'react';
import { ISappInState } from '../app';
import './index.less';

export interface ISappContainerProps {
  app: ISappInState;
}

export function SappContainer(props: ISappContainerProps) {
  const ref = useRef<any>();

  const title = (
    <div>
      小程序
      <Button size={'small'} className="fr">
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
        <iframe className="sapp-frame" src="/first-example-child-1" frameBorder="0" />
      </div>
    </Card>
  );
}

export default memo(SappContainer);
