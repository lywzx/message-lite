import { ConnectService } from './connect.service';
import { ApiImpl } from '../decorator';
import { ApiUnSupport, defer, IPromiseDefer } from '../util';

@ApiImpl()
export class SlaveConnectImplService extends ConnectService {
  protected _connectDefer: IPromiseDefer<void>;

  async preConnect(data: string): Promise<void> {
    this._connectDefer = defer();
  }

  async connect(id: string) {
    return ApiUnSupport();
  }

  preDisConnect(): Promise<void> {
    return ApiUnSupport();
  }

  disconnect(id: string): Promise<void> {
    return ApiUnSupport();
  }
}
