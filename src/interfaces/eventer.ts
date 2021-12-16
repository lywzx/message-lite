export interface IEventer<T = any> {
  once(fn: (data: T) => any): void;
  on(fn: (data: T) => any): void;
  off(fn?: (data: T) => any): void;
  emit(data: T): void;
}
