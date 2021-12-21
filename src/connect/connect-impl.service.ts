import { ConnectService } from './connect.service';
import { ApiImpl } from '../decorator';
import { ApiUnSupport, defer, IPromiseDefer } from '../util';

@ApiImpl()
export class ConnectImplService extends ConnectService {
  protected _connectDefer: IPromiseDefer<void>;

  preConnect(data: string): Promise<void> {
    this._connectDefer = defer();
  }

  connect(id: string): Promise<string> {
    return ApiUnSupport();
  }

  preDisConnect(): Promise<void> {
    return ApiUnSupport();
  }

  disconnect(id: string): Promise<void> {
    return ApiUnSupport();
  }
}
