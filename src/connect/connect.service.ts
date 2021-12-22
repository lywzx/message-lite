import { ApiDecl, ApiDeclApi } from '../decorator';
import { BaseService } from '../libs';
import { ApiUnSupport, IPromiseDefer } from '../util';

export const CONST_SERVICE_NAME = '$$__message.inner.connect.service__$$';

@ApiDecl({
  name: CONST_SERVICE_NAME,
})
export class ConnectService extends BaseService {
  @ApiDeclApi({
    notify: true,
  })
  /* istanbul ignore next */
  preConnect(name: string): Promise<void> {
    return ApiUnSupport();
  }

  @ApiDeclApi({
    notify: true,
  })
  /* istanbul ignore next */
  connect(id: string): Promise<() => Promise<void>> {
    return () => {

    }
  }

  @ApiDeclApi({})
  /* istanbul ignore next */
  preDisConnect(): Promise<void> {
    return ApiUnSupport();
  }

  @ApiDeclApi({
    notify: true,
  })
  /* istanbul ignore next */
  disconnect(id: string): Promise<void> {
    return ApiUnSupport();
  }
}
