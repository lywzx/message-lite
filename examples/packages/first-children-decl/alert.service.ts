import { ApiDecl, ApiDeclApi, ApiUnSupport, BaseService } from 'message-lite';

@ApiDecl({
  name: 'com.example.child.alert.service',
})
export class AlertService extends BaseService {
  @ApiDeclApi()
  alert(message: string): Promise<void> {
    return ApiUnSupport();
  }
}
