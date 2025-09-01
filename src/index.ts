// 导出核心类
export { Master } from './master';
export { Slave } from './slave';
export { SimpleMix } from './simple-mix';

// 导出传输层实现
export { WindowMessageTransport, WindowMessageTransportOptions } from './window-message-transport';

// 导出基础服务类
export { MBaseService } from './base-service';

// 导出装饰器
export { ApiDecl, ApiImpl, ApiDeclApi, ApiDeclEvent } from './decorators';

// 导出接口和类型
export * from './interfaces';

// 导出常量和事件
export * from './constants';

// 导出实用函数
export { ApiUnSupport } from './utils/api-unsupport';
export { createDefer } from './utils/defer';

// 导出工具函数
export * from './utils';
