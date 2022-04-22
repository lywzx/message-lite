import { ApiDecl, ApiDeclApi, ApiUnSupport, MBaseService } from 'message-lite';

@ApiDecl({
  name: 'com.example.time',
})
export class TimeService extends MBaseService {
  @ApiDeclApi()
  getSystemTime(): Promise<{ now: string }> {
    return ApiUnSupport();
  }
}
