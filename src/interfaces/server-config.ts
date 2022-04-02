export interface IMessageConfig<T extends (message: any) => void = (message: any) => void> {
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
export interface IMasterServerConfig<T extends (message: any) => void = (message: any) => void>
  extends IMessageConfig<T> {
  createMasterSender(message: any): (m: any) => void;
}

/**
 * slave server config
 */
export interface ISlaveClientConfig<T extends (message: any) => void = (message: any) => void>
  extends IMessageConfig<T> {
  sendMessage(message: any): void;
}
