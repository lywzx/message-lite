/**
 * 消息传输接口
 */
export interface IMessageTransport {
  /**
   * 创建消息发送器
   * @param origin 消息来源
   */
  createSender(origin?: any): (message: any) => void;
  
  /**
   * 监听消息
   * @param fn 消息处理函数
   */
  listenMessage(fn: (message: any) => void): void;
  
  /**
   * 取消监听消息
   * @param fn 消息处理函数
   */
  unListenMessage(fn: (message: any) => void): void;
  
  /**
   * 转换消息格式
   * @param message 原始消息
   */
  transformMessage(message: any): any;
}

/**
 * 连接会话接口
 */
export interface IConnectSession {
  id: string;
  origin: any;
  sender: (message: any) => void;
  connected: boolean;
  metadata?: any;
  getName(): string;
  getService<T>(decl: new () => T): T;
  disconnect(): Promise<void>;
}

/**
 * 服务添加接口
 */
export interface IAddService {
  decl: new () => any;
  impl: new () => any;
}

/**
 * 事件监听器接口
 */
export interface IEventer<T = any> {
  on(listener: (data: T) => void): () => void;
  emit(data: T): void;
}

/**
 * API装饰器选项
 */
export interface IApiDeclOptions {
  name: string;
}

/**
 * SimpleMix选项
 */
export interface ISimpleMixOptions extends IMessageTransport {
  name: string;
  timeout?: number;
}

/**
 * 消息类型枚举
 */
export enum MessageType {
  CONNECT = 'CONNECT',
  CONNECT_ACK = 'CONNECT_ACK',
  CONNECT_FAIL = 'CONNECT_FAIL',
  DISCONNECT = 'DISCONNECT',
  CALL = 'CALL',
  RESPONSE = 'RESPONSE',
  ERROR = 'ERROR',
  EVENT = 'EVENT',
  HEARTBEAT = 'HEARTBEAT',
}

/**
 * 消息结构
 */
export interface IMessage {
  id: string;
  type: MessageType;
  service?: string;
  method?: string;
  args?: any[];
  data?: any;
  error?: any;
  clientId?: string;
  timestamp?: number;
}

/**
 * RPC执行上下文
 */
export interface IRpcContext {
  /**
   * 客户端ID
   */
  clientId: string;
  /**
   * 调用方来源
   */
  origin: any;
  /**
   * 客户端元数据
   */
  metadata?: any;
  /**
   * 调用时间戳
   */
  timestamp: number;
  /**
   * 服务名称
   */
  service: string;
  /**
   * 方法名称
   */
  method: string;
  /**
   * 消息ID
   */
  messageId: string;
}

/**
 * 服务元数据
 */
export interface IServiceMeta {
  name: string;
  methods: Set<string>;
  events: Set<string>;
  declClass: new () => any;
  implClass: new () => any;
  instance?: any;
}
