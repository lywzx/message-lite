export interface IServiceEventerOption {
  eventName: string;
  // 当被监听时的信息
  whenListened?: () => void;
  // 当被取消监听时的信息
  whenUnListened?: () => void;
}

/**
 * service eventer
 */
export interface IEventer<T = any> {
  /**
   * only listen once
   * @param fn
   */
  once(fn: (data: T) => any): IEventerUnListener;

  /**
   * add event listenter
   * @param fn
   */
  on(fn: (data: T) => any): IEventerUnListener;

  /**
   * emit data
   * @param data
   */
  emit(data: T): void;
}

export interface IEventerConstructor<T = any> {
  new (option: IServiceEventerOption): IEventer<T>;
}

export interface IEventerUnListener {
  (): void;
}
