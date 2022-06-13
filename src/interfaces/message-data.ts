import {
  EMessageTypeCall,
  EMessageTypeEvent,
  EMessageTypeEventOff,
  EMessageTypeEventOn,
  EMessageTypeGoodBye,
  EMessageTypeHandshake,
  EMessageTypeResponse,
  EMessageTypeResponseException,
} from '../constant';

/**
 * 消息附带ID
 */
export interface IMessageDataWithId {
  /**
   * message id
   */
  id: number;
}

/**
 * 消息响应
 */
export interface IMessageDataWithResponse {
  /**
   * 消息的响应
   */
  from_id: number;
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
  type: number;
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
  type: typeof EMessageTypeHandshake | typeof EMessageTypeGoodBye;
}

/**
 * 调用消息后，响应数据
 */
export interface IMessageResponseData<T = any> extends Required<IMessageBaseData<T>> {
  /**
   * 响应消息
   */
  type: typeof EMessageTypeResponse | typeof EMessageTypeResponseException;
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
  type: typeof EMessageTypeCall;
}

/**
 * 开始监听事件
 */
export interface IMessageEvent<T = any> extends IMessageBaseData<T> {
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
  type: typeof EMessageTypeEventOff | typeof EMessageTypeEventOn | typeof EMessageTypeEvent;
}
