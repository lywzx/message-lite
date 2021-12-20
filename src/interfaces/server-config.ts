export interface IServerConfigBase<T extends (message: any) => void = (message: any) => void> {
  listenMessage(fn: T): void;
  unListenMessage(fn: T): void;
  /**
   * message transform
   * @param message
   */
  transformMessage?: (message: any) => any;
}

/**
 * master create server
 */
export interface IMasterServerConfig<T extends (message: any) => void> extends IServerConfigBase<T> {
  createMasterSender(message: any): (m: any) => void;
}

/**
 * slave server config
 */
export interface ISlaveClientConfig<T extends (message: any) => void> extends IServerConfigBase<T> {
  sendMessage(message: any): void;
}
