import React, { useCallback, useRef, useState } from 'react';
import Button from 'antd/lib/button';
import { SimpleMix } from 'message-lite';
import { CustomEvent } from '@example/first-example-decl';
import Row from 'antd/lib/row';
import { ALL_SERVICE } from '../../core/impl';
import { AlertService } from '@example/first-children-decl';

export enum EConnectStatus {
  TO_CONNECT,
  CONNECTING,
  CONNECTED,
  FAILED,
}

const textMap = new Map([
  [EConnectStatus.TO_CONNECT, '点击后；再打开小程序2；点连接'],
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
      name: 'app-miniapp-test-connect',
      listenMessage(fn: (message: any) => void): void {
        window.parent.addEventListener(listenEventName, fn);
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
    }).addService(ALL_SERVICE);
    updateClientState(EConnectStatus.CONNECTING);

    currentClient
      .current!.waitConnect({})
      .then(() => {
        updateClientState(EConnectStatus.CONNECTED);
      })
      .catch(() => {
        updateClientState(EConnectStatus.FAILED);
      });

    currentClient.current!.closed.then(() => {
      updateClientState(EConnectStatus.TO_CONNECT);
    });
  }, []);

  const notify = useCallback(() => {
    const service = currentClient.current!.getService(AlertService)!;
    service.alert({ message: '小程序1调用小程序2', description: '测试调用' });
  }, []);

  const clientDisconnect = useCallback(() => {
    currentClient.current!.disconnect().finally(() => {
      currentClient.current = null;
    });
  }, []);

  return (
    <div>
      <Row>
        <Button
          onClick={initClient}
          disabled={![EConnectStatus.TO_CONNECT, EConnectStatus.FAILED].includes(clientState)}
        >
          {textMap.get(clientState)}
        </Button>
      </Row>
      <Row>
        <Button onClick={clientDisconnect} disabled={clientState !== EConnectStatus.CONNECTED}>
          断开连接
        </Button>
      </Row>
      {clientState === EConnectStatus.CONNECTED && (
        <div>
          <Row title="调用服务示例">
            <Button onClick={notify}>弹出消息提醒</Button>
          </Row>
        </div>
      )}
    </div>
  );
}
