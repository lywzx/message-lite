import { Message2Service, MessageService, ScreenService, TimeService } from '@example/first-example-decl';
import Button from 'antd/lib/button';
import Row from 'antd/lib/row';
import React, { Fragment, useRef, useState } from 'react';
import { slave } from '../slave';

export function App() {
  const [screen, setScreen] = useState<{
    listened: boolean;
    width: number | string;
    height: number | string;
  }>({ listened: false, width: '--', height: '--' });

  const showMessage = async () => {
    const message = slave.getService(MessageService);
    await message!.info({
      waitingClose: true,
      duration: 6,
      content: '点击弹出成功！',
    });
  };

  const showMessage2 = async () => {
    const message = slave.getService(Message2Service);
    await message!.info('点击弹出成功！');
  };

  const showMessage3 = async () => {
    const message = slave.getService(Message2Service);
    await message!.info2('点击弹出成功！');
  };

  const showCurrentTime = async () => {
    const timeService = slave.getService(TimeService)!;
    const messageService = slave.getService(MessageService)!;
    const result = await timeService.getSystemTime();
    debugger;
    await messageService.info(`当前系统时间为：${result.now}`);
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const off = useRef<Function>(() => {});
  // 监听低级屏幕宽度
  const listenParentScreen = async () => {
    const screenService = slave.getService(ScreenService)!;

    off.current = screenService.watcher.on((screen) => {
      setScreen({
        listened: true,
        ...screen,
      });
    });
    setScreen({
      listened: true,
      width: '--',
      height: '--',
    });
  };

  // 取消监听
  const unListenParentScreen = async () => {
    off.current();
    setScreen({
      listened: false,
      width: '--',
      height: '--',
    });
  };

  return (
    <Fragment>
      <Row>
        <Button onClick={showMessage}>message1提示信息</Button>
        <Button onClick={showMessage2}>message2提示信息</Button>
        <Button onClick={showMessage3}>message2提示信息info2</Button>
        <Button onClick={showCurrentTime}>打印当前系统时间</Button>
      </Row>
      <Row>
        <Button
          type="primary"
          danger={screen.listened}
          onClick={screen.listened ? unListenParentScreen : listenParentScreen}
        >
          监听父级尺寸
        </Button>
      </Row>
      {screen.listened ? (
        <>
          <Row>父屏尺寸-宽：{screen.width}</Row>
          <Row>父屏尺寸-高：{screen.height}</Row>
        </>
      ) : null}
    </Fragment>
  );
}
