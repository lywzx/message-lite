/**
 * 信息类型
 */
export enum EMessageType {
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
export interface IMessageBaseData {
  /**
   * 每条消息必附带内容
   */
  channel: string;
  type: EMessageType;
  /**
   * 消息数据
   */
  data?: any;
}

/**
 * 调用消息后，响应数据
 */
export interface IMessageResponseData extends IMessageBaseData {
  /**
   * 消息ID
   */
  id: number;
  /**
   * 响应消息
   */
  type: EMessageType.RESPONSE | EMessageType.RESPONSE_EXCEPTION;
  data: any;
}

/**
 * 方法调用或消息消息
 */
export interface IMessageCallData extends IMessageBaseData {
  id: number;
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
  /**
   * 调用消息内容
   */
  data: any[];
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
  type: EMessageType.EVENT_OFF | EMessageType.EVENT_ON | EMessageType.EVENT;
}
