import { ApiDecl, ApiDeclEvent, IEventer, MBaseService } from 'message-lite';

@ApiDecl({
  name: 'com.example.child.page.event.service',
})
export class PageEventService extends MBaseService {
  @ApiDeclEvent()
  onPageClientPos: IEventer<{ x: number; y: number }>;
}
