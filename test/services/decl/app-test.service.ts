import { ApiDecl, ApiDeclApi, ApiDeclEvent, ApiUnSupport, IEventer, MBaseService } from '../../../src';

@ApiDecl({
  name: 'net.lyblog.app.test',
})
export class AppTestService extends MBaseService {
  @ApiDeclEvent()
  public event: IEventer;

  @ApiDeclApi()
  currentTime(now?: number): Promise<number> {
    return ApiUnSupport();
  }

  @ApiDeclApi({ notify: true })
  notify(): Promise<void> {
    return ApiUnSupport();
  }
}
