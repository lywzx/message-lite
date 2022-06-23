/**
 * session 初始状态
 */
export const ESessionStateInit = 0x0;
/**
 * session 正处在连接握手阶段
 */
export const ESessionStateOpening = 0x1;
/**
 * session 处理可用状态
 */
export const ESessionStateReady = 0x2;
/**
 * 开始准备关闭
 */
export const ESessionStateClosingStart = 0x3;
/**
 * session 等待关闭确认
 */
export const ESessionStateClosingWaitingSecondApprove = 0x4;
/**
 * session 已断开连接
 */
export const ESessionStateClosed = 0x5;
