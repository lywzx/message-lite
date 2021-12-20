import { ApiDecl, ApiDeclApi } from '../decorator';
import { BaseService } from '../libs';
import { ApiUnSupport, IApiCallTimeout } from '../util';

export const CONST_SERVICE_NAME = '$$__message.inner.connect.service__$$';

@ApiDecl({
  name: CONST_SERVICE_NAME,
})
export class ConnectService extends BaseService {
  @ApiDeclApi({
    timeout: 30000,
  })
  /* istanbul ignore next */
  connect(id: string, option?: IApiCallTimeout): Promise<string> {
    return ApiUnSupport();
  }

  @ApiDeclApi()
  /* istanbul ignore next */
  disconnect(id: string, option?: IApiCallTimeout): Promise<void> {
    return ApiUnSupport();
  }
}
