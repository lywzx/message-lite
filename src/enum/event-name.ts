export enum EventName {
  /**
   *
   */
  PRE_CONNECT = 'pre_connect',

  /**
   * 当连接成功时，触发的事件
   */
  CONNECTED = 'connected',

  /**
   * 当前客户端尝试连接，但连接失败
   */
  CONNECTED_FAILED = 'connect_failed',
}
