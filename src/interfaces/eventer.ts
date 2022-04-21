export interface IServiceEventerOption {
  eventName: string;
  // 当被监听时的信息
  whenListened?: () => void;
  // 当被取消监听时的信息
  whenUnListened?: () => void;
}

export interface IEventer<T = any> {
  once(fn: (data: T) => any): IEventerUnListener;
  on(fn: (data: T) => any): IEventerUnListener;
  emit(data: T): void;
}

export interface IEventerConstructor<T = any> {
  new (option: IServiceEventerOption): IEventer<T>;
}

export interface IEventerUnListener {
  (): void;
}
