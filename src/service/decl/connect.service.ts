import { MBaseService } from '../m-base-service';
import { ApiDecl, ApiDeclApi } from '../../decorator';
import { ApiUnSupport } from '../../util';

@ApiDecl({
  name: '__$$message.lite.interval.service$$__',
})
export class ConnectService extends MBaseService {
  @ApiDeclApi()
  disconnect(): Promise<void> {
    return ApiUnSupport();
  }

  @ApiDeclApi()
  secondDisconnect(): Promise<void> {
    return ApiUnSupport();
  }
}
