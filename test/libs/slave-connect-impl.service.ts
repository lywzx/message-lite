import { ConnectService } from './connect.service';
import { ApiUnSupport, IPromiseDefer } from '../../src/util';
import { ApiImpl } from '../../src';

@ApiImpl()
export class SlaveConnectImplService extends ConnectService {
  protected _connectDefer: IPromiseDefer<void>;

  async preConnect(data: string): Promise<void> {
    // this._connectDefer = defer();
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
