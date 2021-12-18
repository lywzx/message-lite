import { ApiDecl, ApiDeclApi } from '../../decorator';
import { BaseService } from '../../libs';
import { ApiUnSupport, IApiCallTimeout } from '../../util';

@ApiDecl({
  name: '$$message.inner.connect.service',
})
export class ConnectService extends BaseService {
  @ApiDeclApi({
    timeout: 30000,
  })
  connect(id: string, option?: IApiCallTimeout): Promise<string> {
    return ApiUnSupport();
  }

  @ApiDeclApi()
  disconnect(id: string, option?: IApiCallTimeout): Promise<void> {
    return ApiUnSupport();
  }
}
