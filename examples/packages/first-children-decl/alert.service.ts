import { ApiDecl, ApiDeclApi, ApiUnSupport, MBaseService } from 'message-lite';

@ApiDecl({
  name: 'com.example.child.alert.service',
})
export class AlertService extends MBaseService {
  @ApiDeclApi()
  alert(message: string): Promise<void> {
    return ApiUnSupport();
  }
}
