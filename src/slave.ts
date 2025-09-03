import { EventEmitter } from './utils/event-emitter';
import { Eventer } from './utils/eventer';
import { createDefer, generateId, IDefer } from './utils';
import { 
  IMessageTransport, 
  IAddService, 
  IMessage, 
  MessageType 
} from './interfaces';
import { DEFAULT_TIMEOUT } from './constants';
import { getApiDecl, getApiMethods, getApiEvents, isApiImpl } from './decorators';

/**
 * Slave客户端类，连接到Master
 */
export class Slave extends EventEmitter {
  private transport: IMessageTransport;
  private clientId: string;
  private connected = false;
  private services: Map<string, any> = new Map();
  private serviceInstances: Map<string, any> = new Map();
  private serviceProxies: Map<string, any> = new Map();
  private pendingCalls: Map<string, IDefer> = new Map();
  private connectDefer: IDefer<void> | null = null;
  private availableServices: Set<string> = new Set();

  constructor(transport: IMessageTransport) {
    super();
    this.transport = transport;
  }

  /**
   * 添加服务
   */
  addService(services: IAddService | IAddService[]): this {
    const serviceList = Array.isArray(services) ? services : [services];
    
    for (const service of serviceList) {
      const { decl, impl } = service;
      const declInfo = getApiDecl(decl);
      
      if (!declInfo) {
        throw new Error(`Service ${decl.name} is not decorated with @ApiDecl`);
      }
      
      if (!isApiImpl(impl)) {
        throw new Error(`Service implementation ${impl.name} is not decorated with @ApiImpl`);
      }

      const serviceName = declInfo.name;
      this.services.set(serviceName, { decl, impl });
      
      // 创建服务实例
      const instance = new impl();
      this.serviceInstances.set(serviceName, instance);
    }
    
    return this;
  }

  /**
   * 检查服务是否存在
   */
  hasService(decl: new () => any): boolean {
    const declInfo = getApiDecl(decl);
    if (!declInfo) {
      return false;
    }
    
    const serviceName = declInfo.name;
    
    // 检查本地服务
    if (this.serviceInstances.has(serviceName)) {
      return true;
    }
    
    // 检查远程服务
    return this.availableServices.has(serviceName);
  }

  /**
   * 获取服务实例（优先返回本地服务，然后是远程服务）
   */
  getService<T>(decl: new () => T): T {
    const declInfo = getApiDecl(decl);
    if (!declInfo) {
      throw new Error(`Service ${decl.name} is not decorated with @ApiDecl`);
    }
    
    const serviceName = declInfo.name;
    console.log(`Getting service: ${serviceName}`);
    console.log(`Local services:`, Array.from(this.serviceInstances.keys()));
    console.log(`Available remote services:`, Array.from(this.availableServices));
    
    // 优先返回本地服务实例
    if (this.serviceInstances.has(serviceName)) {
      console.log(`Returning local service instance for ${serviceName}`);
      return this.serviceInstances.get(serviceName);
    }
    
    // 检查是否是可用的远程服务
    if (!this.availableServices.has(serviceName)) {
      // 对于事件服务，即使不在远程服务列表中，也允许创建代理
      // 这样 Slave 可以监听来自 Master 的事件广播
      const events = getApiEvents(decl);
      if (events.size > 0) {
        console.log(`Creating event service proxy for ${serviceName} (not in remote services list)`);
        const proxy = this.createEventServiceProxy(decl, serviceName);
        this.serviceProxies.set(serviceName, proxy);
        return proxy;
      }
      
      const availableServices = Array.from(this.availableServices);
      const localServices = Array.from(this.serviceInstances.keys());
      throw new Error(`Service ${serviceName} is not available. Local services: ${localServices.join(', ')}. Remote services: ${availableServices.join(', ')}`);
    }
    
    console.log(`Creating remote service proxy for ${serviceName}`);
    
    // 返回缓存的代理对象
    if (this.serviceProxies.has(serviceName)) {
      return this.serviceProxies.get(serviceName);
    }
    
    // 创建服务代理
    const proxy = this.createServiceProxy(decl, serviceName);
    this.serviceProxies.set(serviceName, proxy);
    
    return proxy;
  }


  /**
   * 连接到Master
   */
  async connect(options: { name?: string } = {}): Promise<void> {
    if (this.connected) {
      return;
    }

    if (this.connectDefer) {
      return this.connectDefer.promise;
    }

    this.connectDefer = createDefer<void>();
    
    try {
      // 开始监听消息
      this.transport.listenMessage(this.handleMessage);
      
      // 发送连接请求
      const connectMessage: IMessage = {
        id: generateId(),
        type: MessageType.CONNECT,
        clientId: options.name, // 如果为空则不发送clientId，让Master分配
        data: { 
          services: Array.from(this.services.keys()),
          name: options.name || this.clientId || 'anonymous-client'
        },
        timestamp: Date.now(),
      };
      
      const sender = this.transport.createSender();
      sender(connectMessage);
      
      // 设置超时
      const timeout = setTimeout(() => {
        if (this.connectDefer && !this.connected) {
          this.connectDefer.reject(new Error('Connection timeout'));
          this.connectDefer = null;
        }
      }, DEFAULT_TIMEOUT);
      
      await this.connectDefer.promise;
      clearTimeout(timeout);
      
    } catch (error) {
      this.transport.unListenMessage(this.handleMessage);
      this.connectDefer = null;
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }
    
    try {
      // 发送断开连接消息
      const disconnectMessage: IMessage = {
        id: generateId(),
        type: MessageType.DISCONNECT,
        clientId: this.clientId,
        timestamp: Date.now(),
      };
      
      const sender = this.transport.createSender();
      sender(disconnectMessage);
      
    } catch (error) {
      console.error('Error sending disconnect message:', error);
    } finally {
      this.connected = false;
      this.transport.unListenMessage(this.handleMessage);
      this.serviceProxies.clear();
      this.availableServices.clear();
      this.pendingCalls.clear();
    }
  }

  /**
   * 处理消息
   */
  private handleMessage = (rawMessage: any): void => {
    try {
      const transformedMessage = this.transport.transformMessage(rawMessage);
      
      if (!this.isValidMessage(transformedMessage)) {
        return;
      }
      
      const message: IMessage = transformedMessage;
      
      switch (message.type) {
        case MessageType.CONNECT_ACK:
          this.handleConnectAck(message);
          break;
        case MessageType.CONNECT_FAIL:
          this.handleConnectFail(message);
          break;
        case MessageType.RESPONSE:
          this.handleResponse(message);
          break;
        case MessageType.ERROR:
          this.handleError(message);
          break;
        case MessageType.CALL:
          this.handleCall(message);
          break;
        case MessageType.EVENT:
          this.handleEvent(message);
          break;
        case MessageType.HEARTBEAT:
          this.handleHeartbeat(message);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * 处理连接确认
   */
  private handleConnectAck(message: IMessage): void {
    this.connected = true;
    
    // 更新由Master分配的clientId
    if (message.clientId && message.clientId !== this.clientId) {
      console.log(`Client ID assigned by master: ${message.clientId} (was: ${this.clientId})`);
      this.clientId = message.clientId;
    }
    
    // 保存可用服务列表
    if (message.data && message.data.services) {
      this.availableServices = new Set(message.data.services);
    }
    
    if (this.connectDefer) {
      this.connectDefer.resolve();
      this.connectDefer = null;
    }
  }

  /**
   * 处理连接失败
   */
  private handleConnectFail(message: IMessage): void {
    if (this.connectDefer) {
      this.connectDefer.reject(new Error(message.error || 'Connection failed'));
      this.connectDefer = null;
    }
  }

  /**
   * 处理响应
   */
  private handleResponse(message: IMessage): void {
    const { id, data } = message;
    const defer = this.pendingCalls.get(id);
    
    if (defer) {
      defer.resolve(data);
      this.pendingCalls.delete(id);
    }
  }

  /**
   * 处理错误
   */
  private handleError(message: IMessage): void {
    const { id, error } = message;
    console.log(`Slave received error for message ${id}:`, error);
    
    const defer = this.pendingCalls.get(id);
    
    if (defer) {
      defer.reject(new Error(error || 'Unknown error'));
      this.pendingCalls.delete(id);
    }
  }

  /**
   * 处理服务调用（来自Master的调用）
   */
  private async handleCall(message: IMessage): Promise<void> {
    const { id, service, method, args, clientId } = message;
    
    if (!service || !method) {
      return;
    }

    try {
      const serviceInstance = this.serviceInstances.get(service);
      if (!serviceInstance) {
        throw new Error(`Service ${service} not found`);
      }

      const methodHandler = serviceInstance[method];
      if (typeof methodHandler !== 'function') {
        throw new Error(`Method ${method} not found in service ${service}`);
      }

      // 调用服务方法
      const result = await methodHandler.apply(serviceInstance, args || []);
      
      // 发送响应
      const responseMessage: IMessage = {
        id: generateId(),
        type: MessageType.RESPONSE,
        service,
        method,
        data: result,
        timestamp: Date.now(),
      };
      
      const sender = this.transport.createSender();
      sender(responseMessage);
      
    } catch (error) {
      // 发送错误响应
      const errorMessage: IMessage = {
        id: generateId(),
        type: MessageType.ERROR,
        service,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
      
      const sender = this.transport.createSender();
      sender(errorMessage);
    }
  }

  /**
   * 处理事件
   */
  private handleEvent(message: IMessage): void {
    const { service, method, data } = message;
    
    if (!service || !method) {
      return;
    }
    
    // 查找对应的服务代理并触发事件
    const serviceProxy = this.serviceProxies.get(service);
    if (serviceProxy && serviceProxy[method]) {
      // 如果服务代理存在且有对应的事件方法，触发事件
      serviceProxy[method].emit(data);
    } else {
      // 如果服务代理不存在，创建一个临时的事件发射器来处理事件
      // 这样即使没有显式订阅服务，也能接收事件
      console.log(`Received event from service ${service}.${method}:`, data);
      
      // 可以在这里添加全局事件处理逻辑
      // 例如：this.emit('remoteEvent', { service, method, data });
    }
  }

  /**
   * 处理心跳
   */
  private handleHeartbeat(message: IMessage): void {
    // 响应心跳
    const heartbeatResponse: IMessage = {
      id: generateId(),
      type: MessageType.HEARTBEAT,
      clientId: this.clientId,
      timestamp: Date.now(),
    };
    
    const sender = this.transport.createSender();
    sender(heartbeatResponse);
  }

  /**
   * 创建事件服务代理（用于监听来自Master的事件广播）
   */
  private createEventServiceProxy<T>(decl: new () => T, serviceName: string): T {
    const events = getApiEvents(decl);
    const proxy = {} as T;
    
    // 为每个事件创建代理
    events.forEach((eventName: string) => {
      // 创建本地事件发射器来接收来自Master的事件
      const eventer = new Eventer();
      
      (proxy as any)[eventName] = {
        on: (listener: (data: any) => void) => {
          // 订阅本地事件
          return eventer.on(listener);
        },
        emit: (data: any) => {
          // 触发本地事件（通常由handleEvent调用）
          eventer.emit(data);
        }
      };
    });
    
    return proxy;
  }

  /**
   * 创建服务代理
   */
  private createServiceProxy<T>(decl: new () => T, serviceName: string): T {
    const methods = getApiMethods(decl);
    const proxy = {} as T;
    
    // 调试信息
    console.log(`Creating service proxy for ${serviceName}, methods:`, Array.from(methods));
    
    // 为每个方法创建代理函数
    methods.forEach(methodName => {
      (proxy as any)[methodName] = async (...args: any[]) => {
        if (!this.connected) {
          throw new Error('Not connected to master');
        }
        
        console.log(`Calling remote method: ${serviceName}.${methodName}`, args);
        
        const messageId = generateId();
        const defer = createDefer();
        
        this.pendingCalls.set(messageId, defer);
        
        // 设置超时
        const timeout = setTimeout(() => {
          if (this.pendingCalls.has(messageId)) {
            this.pendingCalls.delete(messageId);
            defer.reject(new Error(`Method call timeout: ${serviceName}.${methodName}`));
          }
        }, DEFAULT_TIMEOUT);
        
        try {
          const callMessage: IMessage = {
            id: messageId,
            type: MessageType.CALL,
            service: serviceName,
            method: methodName,
            args,
            clientId: this.clientId,
            timestamp: Date.now(),
          };
          
          const sender = this.transport.createSender();
          sender(callMessage);
          
          const result = await defer.promise;
          clearTimeout(timeout);
          return result;
          
        } catch (error) {
          clearTimeout(timeout);
          this.pendingCalls.delete(messageId);
          throw error;
        }
      };
    });
    
    return proxy;
  }

  /**
   * 验证消息格式
   */
  private isValidMessage(message: any): message is IMessage {
    return message && 
           typeof message === 'object' &&
           typeof message.type === 'string' &&
           Object.values(MessageType).includes(message.type as MessageType);
  }
}
