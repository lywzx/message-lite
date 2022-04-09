import { Class } from '../types';
import {
  ApiDecl as InnerApiDecl,
  apiDeclMethodOrEvent as InnerApiDeclMethodOrEvent,
  IApiDeclFullApi,
  apiDeclMethodOrEvent,
  IApiDeclFullApiEvent,
  getApiDeclInfo,
} from '../util/api-decl';
import { MBaseService } from '../service';

/**
 * decl api
 */
export interface IApiDeclOption {
  name: string;
}

/**
 * service decl
 *
 */
export function ApiDecl(option: IApiDeclOption) {
  return function <T extends MBaseService>(target: Class<T>) {
    InnerApiDecl(target, option.name);
  };
}

/**
 * decl api
 * @constructor
 */
export function ApiDeclApi(option: Omit<IApiDeclFullApi, 'method'> = {}) {
  return function api<T extends (...args: any) => Promise<any>>(
    target: Class<MBaseService>['prototype'],
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    InnerApiDeclMethodOrEvent(
      target.constructor,
      Object.assign({}, option, {
        method: propertyKey as string,
      }),
      'method'
    );
    return descriptor;
  };
}

/**
 * decl api subject
 */
export function ApiDeclEvent(option: Omit<IApiDeclFullApiEvent, 'name'> = {}) {
  return function declObservable<T extends MBaseService>(target: Class<T>['prototype'], propertyKey: string | symbol) {
    apiDeclMethodOrEvent(
      target.constructor,
      Object.assign({}, option, {
        name: propertyKey as string,
      }),
      'event'
    );
  };
}

/**
 * impl api decorator
 *
 * @param option
 */
/**
 * service impl
 *
 * @param option
 */
export function ApiImpl() {
  return function <T extends MBaseService>(serv: Class<T>) {
    const message = `class ${serv.name} should extends impl service`;
    try {
      getApiDeclInfo(serv, false);
      throw new Error(message);
    } catch (e) {
      if (e.message === message) {
        throw e;
      }
    }
    getApiDeclInfo(serv);

    return serv;
  };
}
