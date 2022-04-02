import { ApiDecl, ApiDeclApi } from '../decorator';
import { ApiUnSupport } from '../util';
import { MBaseService } from '../service';

export const CONST_SERVICE_NAME = '$$__message.inner.connect.service__$$';

@ApiDecl({
  name: CONST_SERVICE_NAME,
})
export class ConnectService extends MBaseService {
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
  async connect(id: string): Promise<() => Promise<void>> {
    return () => Promise.resolve();
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
