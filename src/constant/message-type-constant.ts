/**
 * 握手协议
 */
export const EMessageTypeHandshake = 0x0;
/**
 * 分手协议
 */
export const EMessageTypeGoodBye = 0x1;
/**
 * 二次确认断开连接
 */
export const EMessageTypeGoodByeTwice = 0x2;
/**
 * 方法调用
 */
export const EMessageTypeCall = 0x3;
/**
 * 方法调用响应
 */
export const EMessageTypeResponse = 0x4;
/**
 * 方法调用异常响应
 */
export const EMessageTypeResponseException = 0x5;
/**
 * 事件触发时，响应类型
 */
export const EMessageTypeEvent = 0x6;
/**
 * 事件监听触发
 */
export const EMessageTypeEventOn = 0x7;
/**
 * 事件取消监听时触发
 */
export const EMessageTypeEventOff = 0x8;
