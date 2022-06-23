export class CustomEvent<T = any> extends Event {
  public data: T;

  constructor(type: string, data: T, eventInitDict?: EventInit) {
    super(type, eventInitDict);
    this.data = data;
  }
}
