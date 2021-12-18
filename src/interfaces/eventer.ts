export interface IEventer<T = any> {
  once(fn: (data: T) => any): IEventerUnListener;
  on(fn: (data: T) => any): IEventerUnListener;
  emit(data: T): void;
}

export interface IEventerUnListener {
  (): void;
}
