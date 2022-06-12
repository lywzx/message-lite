import { ApiDecl, ApiDeclApi, ApiUnSupport, MBaseService } from 'message-lite';

@ApiDecl({
  name: 'com.example.child.alert.service',
})
export class AlertService extends MBaseService {
  @ApiDeclApi()
  alert(content: { message: string; description: string }): Promise<void> {
    return ApiUnSupport();
  }
}
