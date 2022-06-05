import { Class } from '../types';
import { MBaseService } from '../service';
import { throwException } from './exception';

export interface IApiDeclFullOption {
  name: string;
  apis: IApiDeclFullApi[];
  events: IApiDeclFullApiEvent[];
}

export interface IApiCallTimeout {
  /**
   * 调用超时
   */
  timeout?: number;
}

export interface IApiTransform {
  send: (args: any) => any;
  receive: (rawArgs: any) => any;
}

export interface IApiCallOrResponseTransform {
  /**
   * salve call
   */
  onCallTransform?: IApiTransform;
  /**
   * ser ret res
   */
  onReturnTransform?: IApiTransform;
}

export interface IApiDeclFullApi extends IApiCallTimeout, IApiCallOrResponseTransform {
  /**
   * 方法名称
   */
  method: string;
  /**
   * 是否仅提示
   */
  notify?: boolean;
}

/**
 * event
 */
export interface IApiDeclFullApiEvent extends IApiCallOrResponseTransform {
  name: string;
}

const API_DECL_MAP = new Map<Class<MBaseService>, IApiDeclFullOption>();
export function ApiDecl<T>(decl: Class<T>, name: string) {
  if (!MBaseService.isPrototypeOf(decl)) {
    throwException(`${decl.name} should extends ${MBaseService.name}`);
  }
  const option: IApiDeclFullOption = {
    name,
    apis: [],
    events: [],
  };
  if (API_DECL_MAP.has(decl)) {
    const oldValue = API_DECL_MAP.get(decl)!;
    option.apis = oldValue.apis;
    option.events = oldValue.events;
  }

  API_DECL_MAP.set(decl, option);
}

export function apiDeclMethodOrEvent<T>(decl: Class<T>, option: IApiDeclFullApi, type: 'method'): void;
export function apiDeclMethodOrEvent<T>(decl: Class<T>, option: IApiDeclFullApiEvent, type: 'event'): void;
export function apiDeclMethodOrEvent<T>(
  decl: Class<T>,
  option: IApiDeclFullApi | IApiDeclFullApiEvent,
  type: 'method' | 'event'
): void {
  const opt: IApiDeclFullOption = {
    name: '',
    apis: [],
    events: [],
  };
  if (API_DECL_MAP.has(decl)) {
    const oldValue = API_DECL_MAP.get(decl)!;
    Object.assign(opt, oldValue);
  }
  const isMethod = type === 'method';
  const findMethod = isMethod
    ? (item: IApiDeclFullApi) => item.method === (option as IApiDeclFullApi).method
    : (item: IApiDeclFullApiEvent) => item.name === (option as IApiDeclFullApiEvent).name;
  const currentEdit = isMethod ? opt.apis : opt.events;
  const idx = (currentEdit as any).findIndex(findMethod);
  if (idx !== -1) {
    currentEdit.splice(idx, 1);
  }
  currentEdit.push(option as any);
  API_DECL_MAP.set(decl, opt);
}

/**
 * 获取某个类的声明
 * @param decl
 * @param inherit
 */
export function getApiDeclInfo<T>(decl: Class<T>, inherit = true): IApiDeclFullOption {
  if (!MBaseService.isPrototypeOf(decl)) {
    throwException('service is not extends MBaseService');
  }
  const opt: IApiDeclFullOption = {
    name: '',
    apis: [],
    events: [],
  };
  let currentDecl: any = decl;
  do {
    const allApiDecorator = API_DECL_MAP.get(currentDecl);
    if (allApiDecorator) {
      if (!opt.name) {
        opt.name = allApiDecorator.name;
      }
      const apis = allApiDecorator.apis.filter((it) => {
        return !opt.apis.find((item) => item.method === it.method);
      });
      opt.apis.push(...apis);
      const events = allApiDecorator.events.filter((it) => {
        return !opt.events.find((item) => item.name === it.name);
      });
      opt.events.push(...events);
    }
    currentDecl = Object.getPrototypeOf(currentDecl);
  } while (currentDecl && inherit);

  if (!opt.name) {
    throwException('can not find decl!');
  }

  return opt;
}
