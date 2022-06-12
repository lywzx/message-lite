import { ApiDecl, ApiDeclApi, ApiUnSupport, MBaseService } from '../../../src';

@ApiDecl({
  name: 'net.lyblog.app.test',
})
export class AppTestService extends MBaseService {
  @ApiDeclApi()
  currentTime(): Promise<number> {
    return ApiUnSupport();
  }

  @ApiDeclApi({ notify: true })
  notify(): Promise<void> {
    return ApiUnSupport();
  }
}
