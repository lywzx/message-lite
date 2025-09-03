import { EventEmitter } from './utils/event-emitter';
import { createDefer, generateId, IDefer } from './utils';
import { 
  IMessageTransport, 
  IAddService, 
  IMessage, 
  MessageType,
  ISimpleMixOptions
} from './interfaces';
import { DEFAULT_TIMEOUT } from './constants';
import { getApiDecl, getApiMethods, isApiImpl } from './decorators';

/**
 * SimpleMix类，用于一对一客户端通信
 */
export class SimpleMix extends EventEmitter {
  private transport: IMessageTransport;
  private name: string;
  private timeout: number;
  private connected = false;
  private isWaiting = false;
  private services: Map<string, any> = new Map();
  private serviceInstances: Map<string, any> = new Map();
  private serviceProxies: Map<string, any> = new Map();
  private pendingCalls: Map<string, IDefer> = new Map();
  private connectDefer: IDefer<void> | null = null;
  private waitConnectDefer: IDefer<void> | null = null;
  private availableServices: Set<string> = new Set();
  private closedDefer: IDefer<void> = createDefer<void>();

  constructor(options: ISimpleMixOptions) {
    super();
    this.transport = options;
    this.name = options.name;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
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
   * 获取服务实例
   */
  getService<T>(decl: new () => T): T {
    const declInfo = getApiDecl(decl);
    if (!declInfo) {
      throw new Error(`Service ${decl.name} is not decorated with @ApiDecl`);
    }
    
    const serviceName = declInfo.name;
    
    // 检查本地服务
    if (this.serviceInstances.has(serviceName)) {
      return this.serviceInstances.get(serviceName);
    }
    
    // 检查远程服务
    if (!this.availableServices.has(serviceName)) {
      const availableServices = Array.from(this.availableServices);
      const localServices = Array.from(this.serviceInstances.keys());
      throw new Error(`Service ${serviceName} is not available. Local services: ${localServices.join(', ')}. Remote services: ${availableServices.join(', ')}`);
    }
    
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
   * 等待连接（作为连接接收方）
   */
  async waitConnect(options: any = {}): Promise<void> {
    if (this.connected || this.isWaiting) {
      return;
    }

    if (this.waitConnectDefer) {
      return this.waitConnectDefer.promise;
    }

    this.waitConnectDefer = createDefer<void>();
    this.isWaiting = true;
    
    try {
      // 开始监听消息
      this.transport.listenMessage(this.handleMessage);
      
      // 设置超时
      const timeout = setTimeout(() => {
        if (this.waitConnectDefer && !this.connected) {
          this.waitConnectDefer.reject(new Error('Wait connection timeout'));
          this.waitConnectDefer = null;
          this.isWaiting = false;
        }
      }, this.timeout);
      
      await this.waitConnectDefer.promise;
      clearTimeout(timeout);
      
    } catch (error) {
      this.transport.unListenMessage(this.handleMessage);
      this.waitConnectDefer = null;
      this.isWaiting = false;
      throw error;
    }
  }

  /**
   * 主动连接（作为连接发起方）
   */
  async connect(options: any = {}): Promise<void> {
    if (this.connected) {
      return;
    }

    if (this.connectDefer) {
      return this.connectDefer.promise;
    }

    this.connectDefer = createDefer<void>();
    
    try {
      // 开始监听消息
      this.transport.listenMessage(this.handleMessage.bind(this));
      
      // 发送连接请求
      const connectMessage: IMessage = {
        id: generateId(),
        type: MessageType.CONNECT,
        data: { 
          name: options.name || this.name,
          services: Array.from(this.services.keys()) 
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
      }, this.timeout);
      
      await this.connectDefer.promise;
      clearTimeout(timeout);
      
    } catch (error) {
      this.transport.unListenMessage(this.handleMessage.bind(this));
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
        data: { name: this.name },
        timestamp: Date.now(),
      };
      
      const sender = this.transport.createSender();
      sender(disconnectMessage);
      
    } catch (error) {
      console.error('Error sending disconnect message:', error);
    } finally {
      this.connected = false;
      this.isWaiting = false;
      this.transport.unListenMessage(this.handleMessage.bind(this));
      this.serviceProxies.clear();
      this.availableServices.clear();
      this.pendingCalls.clear();
      
      // 触发关闭事件
      if (!this.closedDefer) {
        this.closedDefer = createDefer<void>();
      }
      this.closedDefer.resolve();
    }
  }

  /**
   * 获取关闭Promise
   */
  get closed(): Promise<void> {
    return this.closedDefer.promise;
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
        case MessageType.CONNECT:
          this.handleConnect(message, rawMessage);
          break;
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
        case MessageType.DISCONNECT:
          this.handleDisconnect(message);
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
   * 处理连接请求
   */
  private handleConnect(message: IMessage, origin: any): void {
    if (!this.isWaiting) {
      return;
    }
    
    try {
      const sender = this.transport.createSender(origin);
      
      // 保存可用服务列表
      if (message.data && message.data.services) {
        this.availableServices = new Set(message.data.services);
      }
      
      // 发送连接确认
      const ackMessage: IMessage = {
        id: generateId(),
        type: MessageType.CONNECT_ACK,
        data: { 
          name: this.name,
          services: Array.from(this.services.keys()) 
        },
        timestamp: Date.now(),
      };
      
      sender(ackMessage);
      
      this.connected = true;
      this.isWaiting = false;
      
      if (this.waitConnectDefer) {
        this.waitConnectDefer.resolve();
        this.waitConnectDefer = null;
      }
      
    } catch (error) {
      // 发送连接失败
      try {
        const sender = this.transport.createSender(origin);
        const failMessage: IMessage = {
          id: generateId(),
          type: MessageType.CONNECT_FAIL,
          error: error instanceof Error ? error.message : 'Connection failed',
          timestamp: Date.now(),
        };
        sender(failMessage);
      } catch (senderError) {
        console.error('Failed to send connection failure message:', senderError);
      }
      
      if (this.waitConnectDefer) {
        this.waitConnectDefer.reject(error);
        this.waitConnectDefer = null;
      }
    }
  }

  /**
   * 处理连接确认
   */
  private handleConnectAck(message: IMessage): void {
    this.connected = true;
    
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
    const defer = this.pendingCalls.get(id);
    
    if (defer) {
      defer.reject(new Error(error || 'Unknown error'));
      this.pendingCalls.delete(id);
    }
  }

  /**
   * 处理服务调用
   */
  private async handleCall(message: IMessage): Promise<void> {
    const { id, service, method, args } = message;
    
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
   * 处理断开连接
   */
  private handleDisconnect(message: IMessage): void {
    this.disconnect();
  }

  /**
   * 处理事件
   */
  private handleEvent(message: IMessage): void {
    const { data } = message;
    
    // 查找对应的服务代理并触发事件
    for (const [serviceName, serviceProxy] of this.serviceProxies.entries()) {
      if (serviceProxy.watcher) {
        serviceProxy.watcher.emit(data);
        break;
      }
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
      timestamp: Date.now(),
    };
    
    const sender = this.transport.createSender();
    sender(heartbeatResponse);
  }

  /**
   * 创建服务代理
   */
  private createServiceProxy<T>(decl: new () => T, serviceName: string): T {
    const methods = getApiMethods(decl);
    const proxy = {} as T;
    
    // 为每个方法创建代理函数
    methods.forEach(methodName => {
      (proxy as any)[methodName] = async (...args: any[]) => {
        if (!this.connected) {
          throw new Error('Not connected');
        }
        
        const messageId = generateId();
        const defer = createDefer();
        
        this.pendingCalls.set(messageId, defer);
        
        // 设置超时
        const timeout = setTimeout(() => {
          if (this.pendingCalls.has(messageId)) {
            this.pendingCalls.delete(messageId);
            defer.reject(new Error(`Method call timeout: ${serviceName}.${methodName}`));
          }
        }, this.timeout);
        
        try {
          const callMessage: IMessage = {
            id: messageId,
            type: MessageType.CALL,
            service: serviceName,
            method: methodName,
            args,
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
