import { MBaseService } from '../service/index-export';
import { Class } from '../types';

export interface IMessageConfig<T extends (message: any) => void = (message: any) => void> {
  listenMessage(fn: T): void;
  unListenMessage(fn: T): void;
  /**
   * message transform
   * @param message
   */
  transformMessage?: (message: any) => any;
  /**
   * create message sender
   */
  createSender(origin?: any): (message: any) => void;
}
/**
 * add service config
 */
export interface IAddService<T extends MBaseService = any, U extends T = any> {
  impl: Class<U> | ((...args: any[]) => U);
  decl: Class<T>;
}
