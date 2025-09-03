import { EventEmitter } from './utils/event-emitter';
import { Eventer } from './utils/eventer';
import { createDefer, generateId, IDefer } from './utils';
import { 
  IMessageTransport, 
  IConnectSession, 
  IAddService, 
  IMessage, 
  MessageType,
  IRpcContext
} from './interfaces';
import { CONNECTED, CONNECTED_FAILED, DISCONNECT } from './constants';
import { getApiDecl, getApiMethods, getApiEvents, isApiImpl } from './decorators';

/**
 * Master服务端类，用于一对多通信
 */
export class Master extends EventEmitter {
  private transport: IMessageTransport;
  private sessions: Map<string, IConnectSession> = new Map();
  private services: Map<string, any> = new Map();
  private serviceInstances: Map<string, any> = new Map();
  private pendingCalls: Map<string, IDefer> = new Map();
  private slaveEventEmitters: Map<string, Eventer> = new Map();
  private started = false;

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
    
    return this.serviceInstances.has(declInfo.name);
  }

  /**
   * 获取服务实例（用于事件广播，与addService注册的服务无关）
   */
  getService<T>(decl: new () => T): T {
    const declInfo = getApiDecl(decl);
    if (!declInfo) {
      throw new Error(`Service ${decl.name} is not decorated with @ApiDecl`);
    }
    
    // 创建一个独立的服务实例，专门用于事件广播
    return this.createBroadcastServiceProxy(decl);
  }

  /**
   * 获取Slave服务实例（用于调用Slave的方法和监听Slave的事件）
   */
  getSlaveService<T>(decl: new () => T, clientId?: string): T {
    const declInfo = getApiDecl(decl);
    if (!declInfo) {
      throw new Error(`Service ${decl.name} is not decorated with @ApiDecl`);
    }
    
    const serviceName = declInfo.name;
    
    // 如果指定了clientId，获取特定Slave的服务
    if (clientId) {
      const session = this.sessions.get(clientId);
      if (!session) {
        throw new Error(`Client ${clientId} not found`);
      }
      return this.createSessionServiceProxy(decl, session);
    }
    
    // 如果没有指定clientId，获取第一个可用的Slave服务
    const sessions = Array.from(this.sessions.values());
    if (sessions.length === 0) {
      throw new Error(`No connected clients available for service ${serviceName}`);
    }
    
    // 返回第一个连接客户端的服务代理
    return this.createSessionServiceProxy(decl, sessions[0]);
  }

  /**
   * 启动服务端
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }
    
    this.started = true;
    this.transport.listenMessage(this.handleMessage);
  }

  /**
   * 停止服务端
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }
    
    this.started = false;
    this.transport.unListenMessage(this.handleMessage);
    
    // 断开所有连接
    for (const session of this.sessions.values()) {
      await this.disconnectSession(session.id);
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    await this.stop();
  }

  /**
   * 获取客户端会话
   */
  getSession(clientId: string): IConnectSession[] {
    const session = this.sessions.get(clientId);
    console.log(`Getting session for client ${clientId}:`, session);
    console.log(`Available sessions:`, Array.from(this.sessions.keys()));
    return session ? [session] : [];
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): IConnectSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 获取单个会话
   */
  getSingleSession(clientId: string): IConnectSession | undefined {
    return this.sessions.get(clientId);
  }
  getSessions(): IConnectSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 动态分配客户端ID，确保唯一性
   */
  private assignClientId(requestedId?: string): string {
    // 如果客户端请求了特定ID且不冲突，则使用它
    if (requestedId && requestedId.trim() && !this.sessions.has(requestedId)) {
      return requestedId;
    }
    
    // 生成新的唯一ID
    let newId: string;
    let attempts = 0;
    do {
      newId = generateId();
      attempts++;
      // 防止无限循环
      if (attempts > 1000) {
        throw new Error('Unable to generate unique client ID after 1000 attempts');
      }
    } while (this.sessions.has(newId));
    
    return newId;
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
        case MessageType.CALL:
          this.handleCall(message);
          break;
        case MessageType.DISCONNECT:
          this.handleDisconnect(message);
          break;
        case MessageType.RESPONSE:
          this.handleResponse(message);
          break;
        case MessageType.ERROR:
          this.handleError(message);
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
    // 动态分配客户端ID，确保唯一性
    const clientId = this.assignClientId(message.clientId);
    
    try {
      const sender = this.transport.createSender(origin);
      const session: IConnectSession = {
        id: clientId,
        origin,
        sender,
        connected: true,
        metadata: message.data,
        getName(): string {
          return this.metadata?.name || this.id;
        },
        getService: <T>(decl: new () => T): T => {
          return this.createSessionServiceProxy(decl, session);
        },
        disconnect: async (): Promise<void> => {
          await this.disconnectSession(clientId);
        }
      };
      
      this.sessions.set(clientId, session);
      
      // 发送连接确认
      const ackMessage: IMessage = {
        id: generateId(),
        type: MessageType.CONNECT_ACK,
        clientId,
        data: { services: Array.from(this.services.keys()) },
        timestamp: Date.now(),
      };
      
      sender(ackMessage);
      this.emit(CONNECTED, session);
      
    } catch (error) {
      // 发送连接失败
      try {
        const sender = this.transport.createSender(origin);
        const failMessage: IMessage = {
          id: generateId(),
          type: MessageType.CONNECT_FAIL,
          clientId,
          error: error instanceof Error ? error.message : 'Connection failed',
          timestamp: Date.now(),
        };
        sender(failMessage);
      } catch (senderError) {
        console.error('Failed to send connection failure message:', senderError);
      }
      
      this.emit(CONNECTED_FAILED, { id: clientId, error });
    }
  }

  /**
   * 处理服务调用
   */
  private async handleCall(message: IMessage): Promise<void> {
    const { id, service, method, args, clientId } = message;
    
    if (!clientId || !service || !method) {
      return;
    }
    
    const session = this.sessions.get(clientId);
    if (!session) {
      return;
    }

    try {
      console.log(`Master handling call: ${service}.${method}`, args);
      
      const serviceInstance = this.serviceInstances.get(service);
      if (!serviceInstance) {
        throw new Error(`Service ${service} not found`);
      }

      const methodHandler = serviceInstance[method];
      if (typeof methodHandler !== 'function') {
        throw new Error(`Method ${method} not found in service ${service}`);
      }

      // 创建RPC执行上下文
      const context: IRpcContext = {
        clientId: session.id,
        origin: session.origin,
        metadata: session.metadata,
        timestamp: message.timestamp || Date.now(),
        service,
        method,
        messageId: id
      };
      
      // 调用服务方法，传递上下文作为最后一个参数
      const methodArgs = args || [];
      const result = await methodHandler.apply(serviceInstance, [...methodArgs, context]);
      
      console.log(`Master call result for ${service}.${method}:`, result);
      
      // 发送响应
      const responseMessage: IMessage = {
        id: id, // 使用原始消息的id
        type: MessageType.RESPONSE,
        service,
        method,
        data: result,
        timestamp: Date.now(),
      };
      
      session.sender(responseMessage);
      
    } catch (error) {
      console.log(`Master call error for ${service}.${method}:`, error);
      
      // 发送错误响应
      const errorMessage: IMessage = {
        id: id, // 使用原始消息的id，而不是生成新的id
        type: MessageType.ERROR,
        service,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
      
      session.sender(errorMessage);
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnect(message: IMessage): void {
    const { clientId } = message;
    if (clientId) {
      this.disconnectSession(clientId).catch(console.error);
    }
  }

  /**
   * 处理事件
   */
  private handleEvent(message: IMessage): void {
    const { service, method, data, clientId } = message;
    
    if (!service || !method || !clientId) {
      return;
    }
    
    // 查找对应的Slave事件发射器并触发事件
    const eventKey = `slave_${clientId}_${service}_${method}`;
    const eventer = this.slaveEventEmitters.get(eventKey);
    
    if (eventer) {
      // 触发事件，通知Master上订阅了该事件的监听器
      eventer.emit(data);
    } else {
      console.log(`Master received event from slave ${clientId}: ${service}.${method}`, data);
    }
  }

  /**
   * 处理心跳
   */
  private handleHeartbeat(message: IMessage): void {
    const { clientId } = message;
    if (!clientId) {
      return;
    }
    
    const session = this.sessions.get(clientId);
    if (!session) {
      return;
    }
    
    // 响应心跳
    const heartbeatResponse: IMessage = {
      id: generateId(),
      type: MessageType.HEARTBEAT,
      timestamp: Date.now(),
    };
    
    session.sender(heartbeatResponse);
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
   * 断开会话连接
   */
  private async disconnectSession(clientId: string): Promise<void> {
    const session = this.sessions.get(clientId);
    if (session) {
      session.connected = false;
      this.sessions.delete(clientId);
      this.emit(DISCONNECT, session);
    }
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

  /**
   * 创建广播服务代理（独立的服务实例，与addService注册的服务无关）
   */
  private createBroadcastServiceProxy<T>(decl: new () => T): T {
    const declInfo = getApiDecl(decl);
    if (!declInfo) {
      throw new Error(`Service ${decl.name} is not decorated with @ApiDecl`);
    }
    
    const serviceName = declInfo.name;
    const methods = getApiMethods(decl);
    const events = getApiEvents(decl);
    const proxy = {} as T;
    
    // 为每个方法创建代理函数（这些方法只是占位符，实际不执行）
    methods.forEach(methodName => {
      (proxy as any)[methodName] = async (...args: any[]) => {
        console.warn(`Method ${methodName} called on broadcast service ${serviceName}, but this service is only for event broadcasting`);
        return undefined;
      };
    });

    // 为每个事件创建广播代理
    events.forEach((eventName: string) => {
      // 创建独立的事件发射器
      const eventer = new Eventer();
      
      (proxy as any)[eventName] = {
        on: (listener: (data: any) => void) => {
          // 当在Master上订阅事件时，向所有连接的客户端广播
          const unsubscribe = eventer.on((data: any) => {
            // 向所有已连接的客户端广播事件
            this.broadcastEvent(serviceName, eventName, data);
          });
          
          // 返回取消订阅函数
          return () => {
            unsubscribe();
          };
        },
        emit: (data: any) => {
          // 当在Master上触发事件时，向所有连接的客户端广播
          this.broadcastEvent(serviceName, eventName, data);
        }
      };
    });
    
    return proxy;
  }

  /**
   * 广播事件到所有连接的客户端
   */
  private broadcastEvent(serviceName: string, eventName: string, data: any): void {
    const eventMessage: IMessage = {
      id: generateId(),
      type: MessageType.EVENT,
      service: serviceName,
      method: eventName,
      data,
      timestamp: Date.now(),
    };
    
    // 向所有已连接的客户端广播事件
    for (const session of this.sessions.values()) {
      if (session.connected) {
        session.sender(eventMessage);
      }
    }
  }

  /**
   * 创建会话服务代理
   */
  private createSessionServiceProxy<T>(decl: new () => T, session: IConnectSession): T {
    const declInfo = getApiDecl(decl);
    if (!declInfo) {
      throw new Error(`Service ${decl.name} is not decorated with @ApiDecl`);
    }
    
    const serviceName = declInfo.name;
    const methods = getApiMethods(decl);
    const events = getApiEvents(decl);
    const proxy = {} as T;
    
    // 为每个方法创建代理函数
    methods.forEach(methodName => {
      (proxy as any)[methodName] = async (...args: any[]) => {
        if (!session.connected) {
          throw new Error('Session not connected');
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
        }, 30000); // 30秒超时
        
        try {
          const callMessage: IMessage = {
            id: messageId,
            type: MessageType.CALL,
            service: serviceName,
            method: methodName,
            args,
            clientId: session.id,
            timestamp: Date.now(),
          };
          
          session.sender(callMessage);
          
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

    // 为每个事件创建代理
    events.forEach((eventName: string) => {
      // 创建事件代理，允许Master监听Slave的事件
      const eventKey = `slave_${session.id}_${serviceName}_${eventName}`;
      
      if (!this.slaveEventEmitters.has(eventKey)) {
        this.slaveEventEmitters.set(eventKey, new Eventer());
      }
      
      const eventer = this.slaveEventEmitters.get(eventKey)!;
      
      // 直接设置事件发射器，这样 service.onPageClientPos.on() 就能正常工作
      (proxy as any)[eventName] = eventer;
    });
    
    return proxy;
  }
}
