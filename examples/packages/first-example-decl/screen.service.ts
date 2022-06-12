import { ApiDecl, ApiDeclEvent, IEventer, MBaseService } from 'message-lite';

export interface IScreenInfo {
  width: number;
  height: number;
}

@ApiDecl({
  name: 'ui.screen.watcher',
})
export class ScreenService extends MBaseService {
  @ApiDeclEvent()
  watcher!: IEventer<IScreenInfo>;
}
