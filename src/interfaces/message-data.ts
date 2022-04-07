/**
 * 信息类型
 */
export enum EMessageType {
  /**
   * 握手协议
   */
  HANDSHAKE,
  /**
   * 分手协议
   */
  GOOD_BYE,
  /**
   * 方法调用
   */
  CALL,
  /**
   * 方法响应
   */
  RESPONSE,
  RESPONSE_EXCEPTION,
  /**
   * 事件
   */
  EVENT,
  /**
   * 监听消息
   */
  EVENT_ON,
  /**
   * 取消消息监听
   */
  EVENT_OFF,
}

/**
 * 基础消息
 */
export interface IMessageBaseData<T = any> {
  /**
   * 消息ID
   */
  id: number;
  /**
   * 每条消息必附带内容
   */
  channel: string;
  /**
   * 消息类型
   */
  type: EMessageType;
  /**
   * 消息数据
   */
  data?: T;
}

/**
 * 握手通信协议
 */
export interface IMessageHandshakeData<T = string> extends Required<IMessageBaseData<T>> {
  /**
   * 建立连接/断开连接
   */
  type: EMessageType.HANDSHAKE | EMessageType.GOOD_BYE;
}

/**
 * 调用消息后，响应数据
 */
export interface IMessageResponseData<T = any> extends Required<IMessageBaseData<T>> {
  /**
   * 响应消息
   */
  type: EMessageType.RESPONSE | EMessageType.RESPONSE_EXCEPTION;
}

/**
 * 方法调用或消息消息
 */
export interface IMessageCallData<T = any[]> extends Required<IMessageBaseData<T>> {
  /**
   * 调用的服务名称
   */
  service: string;
  /**
   * 调用的方法名称
   */
  method: string;
  /**
   * 消息类型
   */
  type: EMessageType.CALL;
}

/**
 * 开始监听事件
 */
export interface IMessageEvent extends IMessageBaseData {
  /**
   * 服务名称
   */
  service: string;
  /**
   * 消息名称
   */
  event: string;
  /**
   * 事件相关消息
   */
  type: EMessageType.EVENT_OFF | EMessageType.EVENT_ON | EMessageType.EVENT;
}
