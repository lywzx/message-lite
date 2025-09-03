import { IApiDeclOptions, IServiceMeta } from './interfaces';
import { Eventer } from './utils/eventer';

// 使用Symbol来存储元数据，避免冲突
const API_METHODS_SYMBOL = Symbol('api_methods');
const API_EVENTS_SYMBOL = Symbol('api_events');
const API_DECL_SYMBOL = Symbol('api_decl');

/**
 * 服务声明装饰器
 */
export function ApiDecl(options: IApiDeclOptions) {
  return function <T extends new (...args: any[]) => any>(target: T): T {
    (target as any)[API_DECL_SYMBOL] = options;
    (target as any).serviceName = options.name;
    
    // 初始化方法和事件集合
    if (!(target as any)[API_METHODS_SYMBOL]) {
      (target as any)[API_METHODS_SYMBOL] = new Set<string>();
    }
    if (!(target as any)[API_EVENTS_SYMBOL]) {
      (target as any)[API_EVENTS_SYMBOL] = new Set<string>();
    }
    
    return target;
  };
}

/**
 * 服务实现装饰器
 */
export function ApiImpl() {
  return function <T extends new (...args: any[]) => any>(target: T): T {
    return target;
  };
}

/**
 * API方法声明装饰器
 */
export function ApiDeclApi() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const constructor = target.constructor;
    
    // 确保构造函数有方法集合
    if (!constructor[API_METHODS_SYMBOL]) {
      constructor[API_METHODS_SYMBOL] = new Set<string>();
    }
    
    constructor[API_METHODS_SYMBOL].add(propertyKey);
    console.log(`Added method ${propertyKey} to ${constructor.name}`);
  };
}

/**
 * API事件声明装饰器
 */
export function ApiDeclEvent() {
  return function (target: any, propertyKey: string) {
    const constructor = target.constructor;
    
    // 确保构造函数有事件集合
    if (!constructor[API_EVENTS_SYMBOL]) {
      constructor[API_EVENTS_SYMBOL] = new Set<string>();
    }
    
    constructor[API_EVENTS_SYMBOL].add(propertyKey);
    
    // 为事件属性创建Eventer实例，确保在原型上创建
    if (!target.constructor.prototype[`_${propertyKey}`]) {
      target.constructor.prototype[`_${propertyKey}`] = new Eventer();
    }
    
    Object.defineProperty(target, propertyKey, {
      get: function() {
        return this.constructor.prototype[`_${propertyKey}`];
      },
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * 获取服务声明信息
 */
export function getApiDecl(target: any): IApiDeclOptions | undefined {
  return target[API_DECL_SYMBOL];
}

/**
 * 检查是否为服务实现
 */
export function isApiImpl(target: any): boolean {
  return true; // 简化实现
}

/**
 * 获取API方法列表
 */
export function getApiMethods(target: any): Set<string> {
  const methods = target[API_METHODS_SYMBOL] || new Set<string>();
  console.log(`Getting methods for ${target.name}:`, Array.from(methods));
  return methods;
}

/**
 * 获取API事件列表
 */
export function getApiEvents(target: any): Set<string> {
  return target[API_EVENTS_SYMBOL] || new Set<string>();
}
