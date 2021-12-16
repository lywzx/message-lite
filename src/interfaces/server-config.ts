export interface IServerConfig {
  sendMessage(message: any): void;
  listenMessage(fn: (message: any) => void): void;
  unListenMessage(fn: (message: any) => void): void;
}
