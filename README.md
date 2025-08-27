# 关于message-lite

[![Build Status](https://github.com/lywzx/message-lite/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/lywzx/message-lite/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/lywzx/message-lite/branch/main/graph/badge.svg)](https://codecov.io/gh/lywzx/message-lite)
[![NPM version](https://img.shields.io/npm/v/message-lite.svg?style=flat-square)](https://www.npmjs.com/package/message-lite)
[![NPM downloads](https://img.shields.io/npm/dm/message-lite.svg?style=flat-square)](https://www.npmjs.com/package/message-lite)
[![Known Vulnerabilities](https://snyk.io/test/github/lywzx/message-lite/badge.svg?targetFile=package.json)](https://snyk.io/test/github/lywzx/message-lite?targetFile=package.json)
[![License](https://img.shields.io/npm/l/message-lite.svg?sanitize=true)](https://www.npmjs.com/package/message-lite)

message-lite是一个轻量级的RPC通信库，用于在浏览器环境中实现跨上下文通信，如iframe或window之间的双向通信。

## 特性

- 支持服务器+客户端模式（一对多）
- 支持客户端+客户端模式（一对一）
- 提供服务声明、实现、注册、调用机制
- 支持异步通信和事件监听
- 基于TypeScript编写，提供完整的类型定义
- 使用装饰器简化服务定义和实现

## 待支持的特性

- 心跳
- 断线重连
- 连接过程中的日志输出

## 安装

```bash
# install
yarn add message-lite # or：npm install message-lite --save
```

## 核心概念

message-lite 提供了三种核心通信类：

1. **Master**: 主服务端，用于一对多通信场景
2. **Slave**: 客户端，连接到Master
3. **SimpleMix**: 简单混合模式，用于一对一通信场景

## 使用方法

`message-lite`支持双向通信，支持两个模式：

* 服务器+客户端模式
* 客户端+客户端模式

## 服务器+客户端模式

当前模式，提供了一个一对多的通信模式。

> 以下示例中，均以`iframe`和`postMessage`来完成:

### 创建一个服务器

```typescript
// 创建一个服务
export const master = new Master({
  createSender(event: MessageEvent) {
    return (message: any) => {
      (event.source as WindowProxy)!.postMessage(message, '*', []);
    };
  },
  listenMessage(fn) {
    window.addEventListener(
      'message',
        fn,
      false
    );
  },
  unListenMessage(fn) {
    window.removeEventListener('message', fn, false);
  },
  transformMessage(event: MessageEvent) {
    // 针对event对象，创建消息转换函数
    return event.data;
  },
});
```

### 创建一个客户端

```typescript
export const slave = new Slave({
  createSender() {
    return (message: any) => window.parent!.postMessage(message, '*', []);
  },
  listenMessage(fn) {
    window.addEventListener(
      'message',
      fn,
      false
    );
  },
  unListenMessage(fn: (message: any) => void): void {
    window.removeEventListener('message', fn, false);
  },
  transformMessage(message: MessageEvent) {
    return message.data;
  },
})
```

### 服务声明

声明一个服务，以例在客户端上调用

```typescript
import { ApiDecl, ApiDeclApi, ApiUnSupport, MBaseService } from 'message-lite';

@ApiDecl({
    name: 'com.example.child.alert.service',
})
export class AlertService extends MBaseService {
    @ApiDeclApi()
    alert(content: { message: string; description: string }): Promise<void> {
        return ApiUnSupport();
    }
}
```

### 服务实现

实现`AlterService`服务：

```typescript
import { ApiImpl } from 'message-lite';

@ApiImpl()
export class AlertServiceImpl extends AlertService {
  async alert(content: { message: string; description: string }) {
    alert(`${content.message}: ${content.description}`);
  }
}
```

### 服务注册

将服务注册至`master`中：

```typescript
import { master } from './index';

master.addService([
    {
        decl: AlterService,
        impl: AlertServiceImpl,
    }
]);
```

### 启动服务

启动服务器(master)等待连接：

```typescript
master.start();
```

### 连接服务

在服务连接成功后，调用服务

```typescript
import { slave } from './index';

slave.connect().then(async () => {
    const service = slave.getService(AlterService);

    await service.alert({message: '测试', description: '服务测试'});
});
```

## 客户端+客户端模式

客户端+客户端模式，是一种1对1通信的方式。使用上，与服务器+客户端非常的相似。可以理解为把服务器启动换成了等待连接。

下面是两个客户端：

```typescript
// 客户端1
const client1 = new SimpleMix({
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
});

// 客户端2
const client2 = new SimpleMix({
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
})
```

客户间互相连接：

```typescript
client1.waitConnect().then(() => {
    //
    console.log('连接成功！')
});

client2.connect().then(() => {
    // 连接成功
});
```

### 服务添加及调用

与服务器+客户端模式一样，以上两个客户端均支持`addService`以及`getService`方法。可以很容易添加服务及调用服务。

## 详细示例

### 服务声明与实现

服务声明定义了可以远程调用的接口：

```typescript
// message.service.ts
import { ApiDecl, ApiDeclApi, ApiUnSupport, MBaseService } from 'message-lite';

export interface IMessageOption {
  content: string;
  duration?: number;
  waitingClose?: boolean;
}

export type ImessageServiceType = string | IMessageOption;

@ApiDecl({
  name: 'com.example.message.service',
})
export class MessageService extends MBaseService {
  @ApiDeclApi()
  info(content: ImessageServiceType): Promise<void> {
    return ApiUnSupport();
  }

  @ApiDeclApi()
  success(content: ImessageServiceType): Promise<void> {
    return ApiUnSupport();
  }

  @ApiDeclApi()
  error(content: ImessageServiceType): Promise<void> {
    return ApiUnSupport();
  }
}
```

服务实现提供了具体的功能实现：

```typescript
// message.service.impl.ts
import { IMessageOption, ImessageServiceType, MessageService } from '@example/first-example-decl';
import { message as antdMessage } from 'antd';
import { isString } from 'lodash';
import { ApiImpl } from 'message-lite';

@ApiImpl()
export class MessageServiceImpl extends MessageService {
  info(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'info');
  }

  success(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'success');
  }

  error(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'error');
  }
}
```

### 服务事件声明与使用

除了方法调用，message-lite 还支持服务事件的声明和使用：

```typescript
// screen.service.ts
import { ApiDecl, ApiDeclEvent, IEventer, MBaseService } from 'message-lite';

export interface IScreenInfo {
  width: number;
  height: number;
}

@ApiDecl({
  name: 'ui.screen.watcher',
})
export class ScreenService extends MBaseService {
  @ApiDeclEvent()
  watcher!: IEventer<IScreenInfo>;
}
```

服务事件的实现：

```typescript
// screen.service.impl.ts
import { ScreenService, IScreenInfo } from '@example/first-example-decl';
import { ApiImpl } from 'message-lite';

@ApiImpl()
export class ScreenServiceImpl extends ScreenService {
  // 事件不需要特殊实现，框架会自动处理
}
```

服务事件的使用：

```typescript
// 在客户端使用服务事件
slave.connect().then(async () => {
  const service = slave.getService(ScreenService);
  
  // 监听事件
  const unsubscribe = service.watcher.on((screenInfo: IScreenInfo) => {
    console.log('屏幕尺寸变化:', screenInfo.width, screenInfo.height);
  });
  
  // 在需要时取消监听
  // unsubscribe();
});
```

### Master服务端使用示例

```typescript
// master/index.ts
import { Master } from 'message-lite';
import { ALL_SERVICE } from '../core/impl';

export const master = new Master({
  createSender(event: MessageEvent) {
    return (message: any) => {
      (event.source as WindowProxy)!.postMessage(message, '*', []);
    };
  },
  listenMessage(fn) {
    window.addEventListener('message', fn, false);
  },
  unListenMessage(fn) {
    window.removeEventListener('message', fn, false);
  },
  transformMessage(event: MessageEvent) {
    return event.data;
  },
});

// 添加服务并启动
master.addService(ALL_SERVICE).start();
```

### Slave客户端使用示例

```typescript
// slave/index.ts
import { Slave } from 'message-lite';
import { AlertService } from '@example/first-children-decl';
import { AlertServiceImpl } from '../core/impl/alert.service.impl';

export const slave = new Slave({
  createSender() {
    return (message: any) => window.parent!.postMessage(message, '*', []);
  },
  listenMessage(fn) {
    window.addEventListener('message', fn, false);
  },
  unListenMessage(fn: (message: any) => void): void {
    window.removeEventListener('message', fn, false);
  },
  transformMessage(message: MessageEvent) {
    return message.data;
  },
}).addService([
  {
    decl: AlertService,
    impl: AlertServiceImpl,
  },
]);
```

### 完整使用流程

```typescript
// 客户端连接并使用服务
slave.connect().then(async () => {
  // 获取服务实例
  const service = slave.getService(AlertService);
  
  // 调用远程服务
  await service.alert({
    message: '测试', 
    description: '服务测试'
  });
});
```

### 事件监听

Master支持事件监听机制：

```typescript
// 监听连接事件
import { CONNECTED, CONNECTED_FAILED, DISCONNECT, IConnectSession } from 'message-lite';

master.on(CONNECTED, (session: IConnectSession) => {
  console.log('客户端已连接', session.id);
});

master.on(CONNECTED_FAILED, (session: IConnectSession) => {
  console.log('客户端连接失败', session.id);
});

master.on(DISCONNECT, (session: IConnectSession) => {
  console.log('客户端断开连接', session.id);
});

// 取消监听事件
const connectedHandler = (session: IConnectSession) => {
  console.log('客户端已连接', session.id);
};

master.on(CONNECTED, connectedHandler);
// 在需要取消监听时
master.off(CONNECTED, connectedHandler);
```

### 自定义事件

除了系统事件，还可以使用自定义事件：

```typescript
// 发送自定义事件
master.emit('custom-event', { data: 'custom data' });

// 监听自定义事件
master.on('custom-event', (data) => {
  console.log('收到自定义事件:', data);
});
```

## API参考

### Master类

- `constructor(transport: IMessageTransport)` - 创建Master实例
- `addService(services: IAddService | IAddService[]): this` - 添加服务
- `getService<T>(decl: new () => T): T` - 获取服务实例
- `start(): Promise<void>` - 启动服务端
- `disconnect(): Promise<void>` - 断开所有连接
- `on(event: string, handler: (...args: any[]) => void): void` - 监听事件
- `off(event: string, handler: (...args: any[]) => void): void` - 取消监听事件
- `emit(event: string, ...args: any[]): void` - 触发事件
- `getSession(clientId: string): any | undefined` - 获取客户端会话

### Slave类

- `constructor(transport: IMessageTransport, clientId?: string)` - 创建Slave实例
- `addService(services: any | any[]): this` - 添加服务
- `getService<T>(decl: new () => T): T` - 获取服务实例
- `connect(): Promise<void>` - 连接到Master
- `disconnect(): Promise<void>` - 断开连接

### SimpleMix类

- `constructor(options: SimpleMixOptions)` - 创建SimpleMix实例
- `addService(services: any | any[]): this` - 添加服务
- `getService<T>(decl: new () => T): T` - 获取服务实例
- `waitConnect(): Promise<void>` - 等待其他客户端连接（作为连接接收方）
- `connect(): Promise<void>` - 主动连接到其他客户端（作为连接发起方）
- `disconnect(): Promise<void>` - 断开连接

### 装饰器

- `@ApiDecl(options)` - 服务声明装饰器
- `@ApiImpl()` - 服务实现装饰器
- `@ApiDeclApi()` - API声明装饰器
- `@ApiDeclEvent()` - 事件声明装饰器

### 常量

- `CONNECTED` - 连接成功事件
- `CONNECTED_FAILED` - 连接失败事件
- `DISCONNECT` - 断开连接事件

### 接口

- `IConnectSession` - 连接会话接口
- `IAddService` - 服务添加接口
- `IEventer<T>` - 事件接口

## 许可证

MIT