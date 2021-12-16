import { BaseService } from '../libs/base-service';
import { Class } from '../types';

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

export interface IApiDeclFullApi extends IApiCallTimeout {
  /**
   * 方法名称
   */
  method: string;
  /**
   * 是否仅提示
   */
  notify?: boolean;
}

export interface IApiDeclFullApiEvent {
  name: string;
}

const API_DECL_MAP = new Map<Class<BaseService>, IApiDeclFullOption>();
export function ApiDecl<T>(decl: Class<T>, name: string) {
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

export function ApiDeclApi<T>(decl: Class<T>, option: IApiDeclFullApi) {
  const opt: IApiDeclFullOption = {
    name: '',
    apis: [],
    events: [],
  };
  if (API_DECL_MAP.has(decl)) {
    const oldValue = API_DECL_MAP.get(decl)!;
    Object.assign(opt, oldValue);
  }
  const idx = opt.apis.findIndex((i) => i.method === option.method);
  if (idx !== -1) {
    opt.apis.splice(idx, 1);
  }
  opt.apis.push(option);
  API_DECL_MAP.set(decl, opt);
}

export function ApiDeclEvent<T>(decl: Class<T>, option: IApiDeclFullApiEvent) {
  const opt: IApiDeclFullOption = {
    name: '',
    apis: [],
    events: [],
  };
  if (API_DECL_MAP.has(decl)) {
    const oldValue = API_DECL_MAP.get(decl)!;
    Object.assign(opt, oldValue);
  }
  const idx = opt.events.findIndex((i) => i.name === option.name);
  if (idx !== -1) {
    opt.events.splice(idx, 1);
  }
  opt.events.push(option);
  API_DECL_MAP.set(decl, opt);
}
/**
 * 获取某个类的声明
 * @param decl
 */
export function getApiDeclInfo<T>(decl: Class<T>): IApiDeclFullOption {
  if (!Object.prototype.isPrototypeOf(BaseService)) {
    throw new Error('service is not extends BaseService');
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
    currentDecl = currentDecl.prototype;
  } while (currentDecl);

  if (!opt.name) {
    throw new Error('can not find decl!');
  }

  return opt;
}
