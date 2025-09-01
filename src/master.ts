import { EventEmitter } from './utils/event-emitter';
import { createDefer, generateId, IDefer } from './utils';
import { 
  IMessageTransport, 
  IConnectSession, 
  IAddService, 
  IMessage, 
  MessageType 
} from './interfaces';
import { CONNECTED, CONNECTED_FAILED, DISCONNECT } from './constants';
import { getApiDecl, getApiMethods, isApiImpl } from './decorators';

/**
 * Master服务端类，用于一对多通信
 */
export class Master extends EventEmitter {
  private transport: IMessageTransport;
  private sessions: Map<string, IConnectSession> = new Map();
  private services: Map<string, any> = new Map();
  private serviceInstances: Map<string, any> = new Map();
  private pendingCalls: Map<string, IDefer> = new Map();
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
   * 获取服务实例
   */
  getService<T>(decl: new () => T): T {
    const declInfo = getApiDecl(decl);
    if (!declInfo) {
      throw new Error(`Service ${decl.name} is not decorated with @ApiDecl`);
    }
    
    const instance = this.serviceInstances.get(declInfo.name);
    if (!instance) {
      throw new Error(`Service ${declInfo.name} not found`);
    }
    
    return instance;
  }

  /**
   * 启动服务端
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }
    
    this.started = true;
    this.transport.listenMessage(this.handleMessage.bind(this));
  }

  /**
   * 停止服务端
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }
    
    this.started = false;
    this.transport.unListenMessage(this.handleMessage.bind(this));
    
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
  private handleMessage(rawMessage: any): void {
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

      // 调用服务方法
      const result = await methodHandler.apply(serviceInstance, args || []);
      
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
   * 创建会话服务代理
   */
  private createSessionServiceProxy<T>(decl: new () => T, session: IConnectSession): T {
    const declInfo = getApiDecl(decl);
    if (!declInfo) {
      throw new Error(`Service ${decl.name} is not decorated with @ApiDecl`);
    }
    
    const serviceName = declInfo.name;
    const methods = getApiMethods(decl);
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
    
    return proxy;
  }
}
