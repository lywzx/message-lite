import { BaseService } from '../libs';
import { Class } from '../types';
import {
  ApiDecl as InnerApiDecl,
  apiDeclMethodOrEvent as InnerApiDeclMethodOrEvent,
  IApiDeclFullApi,
  apiDeclMethodOrEvent,
  IApiDeclFullApiEvent,
} from '../util/api-decl';

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
  return function <T extends BaseService>(target: Class<T>) {
    InnerApiDecl(target, option.name);
  };
}

/**
 * decl api
 * @constructor
 */
export function ApiDeclApi(option: Omit<IApiDeclFullApi, 'method'> = {}) {
  return function api<T extends (...args: any) => Promise<any>>(
    target: Class<BaseService>['prototype'],
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    InnerApiDeclMethodOrEvent(
      target.constructor,
      {
        ...option,
        method: propertyKey as string,
      },
      'method'
    );
    return descriptor;
  };
}

/**
 * decl api subject
 */
export function ApiDeclEvent(option: Omit<IApiDeclFullApiEvent, 'name'> = {}) {
  return function declObservable<T extends BaseService>(target: Class<T>['prototype'], propertyKey: string | symbol) {
    apiDeclMethodOrEvent(
      target.constructor,
      {
        ...option,
        name: propertyKey as string,
      },
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
  return function <T extends BaseService>(serv: Class<T>) {
    if (!BaseService.isPrototypeOf(serv)) {
      throw new Error(`${serv.name} is not extends ${BaseService.name}`);
    }
    return serv;
  };
}
