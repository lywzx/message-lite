import React, { useCallback, useRef, useState } from 'react';
import Button from 'antd/lib/button';
import { SimpleMix } from 'message-lite';
import { CustomEvent } from '@example/first-example-decl';

export enum EConnectStatus {
  TO_CONNECT,
  CONNECTING,
  CONNECTED,
  FAILED,
}

const textMap = new Map([
  [EConnectStatus.TO_CONNECT, '连接小程序客户端'],
  [EConnectStatus.CONNECTING, '等待连接'],
  [EConnectStatus.CONNECTED, '连接成功'],
  [EConnectStatus.FAILED, '连接失败'],
]);

const listenEventName = 'simple-from-salve1-connect';
const emitEventName = 'simple-from-salve2-connect';

export function AppClient() {
  const currentClient = useRef<null | SimpleMix>();
  const [clientState, updateClientState] = useState(EConnectStatus.TO_CONNECT);

  const initClient = useCallback(() => {
    currentClient.current = new SimpleMix({
      listenMessage(fn: (message: any) => void): void {
        window.parent.addEventListener(listenEventName, (data) => {
          console.log('1111111', listenEventName, data, (data as any).data);
          fn(data);
        });
      },
      unListenMessage(fn: (message: any) => void): void {
        window.parent.removeEventListener(listenEventName, fn);
      },
      createSender(origin?: any): (message: any) => void {
        return function (p1: any) {
          window.parent.dispatchEvent(new CustomEvent(emitEventName, p1));
        };
      },
      transformMessage(data: CustomEvent) {
        return data.data;
      },
    });
    updateClientState(EConnectStatus.CONNECTING);

    currentClient
      .current!.waitConnect({
        name: 'app-miniapp-test-connect',
      })
      .then(() => {
        updateClientState(EConnectStatus.CONNECTED);
      })
      .catch(() => {
        updateClientState(EConnectStatus.FAILED);
      });
  }, []);

  return (
    <div>
      <Button onClick={initClient}>{textMap.get(clientState)}</Button>
    </div>
  );
}
