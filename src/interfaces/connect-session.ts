export interface IConnectSession {
  /**
   * 连接成功
   */
  opened: Promise<void>;
  /**
   * 关闭连接
   */
  closed: Promise<void>;
  /**
   * 断开连接
   */
  disconnect(): Promise<void>;
  ready(): Promise<void>;
}
