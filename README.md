# 关于message-lite

[![Build Status](https://github.com/lywzx/message-lite/actions/workflows/npm-ci.yml/badge.svg?branch=master)](https://github.com/lywzx/message-lite/actions/workflows/npm-ci.yml)
[![codecov](https://codecov.io/gh/lywzx/message-lite/branch/main/graph/badge.svg)](https://codecov.io/gh/lywzx/message-lite)
[![NPM version](https://img.shields.io/npm/v/message-lite.svg?style=flat-square)](https://www.npmjs.com/package/message-lite)
[![NPM downloads](https://img.shields.io/npm/dm/message-lite.svg?style=flat-square)](https://www.npmjs.com/package/message-lite)
[![Known Vulnerabilities](https://snyk.io/test/github/lywzx/message-lite/badge.svg?targetFile=package.json)](https://snyk.io/test/github/lywzx/message-lite?targetFile=package.json)
[![License](https://img.shields.io/npm/l/message-lite.svg?sanitize=true)](https://www.npmjs.com/package/message-lite)

message-lite是一个RPC通信库

# 开速开始

## 安装

```bash
# install
yarn add message-lite # or：npm install message-lite --save
```

# 使用方法

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
