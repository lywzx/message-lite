import { ImessageServiceType, MessageService } from './message.service';
import { ApiDecl, ApiDeclApi, ApiUnSupport } from 'message-lite';

@ApiDecl({
  name: 'com.example.message2.service',
})
export class Message2Service extends MessageService {
  @ApiDeclApi()
  info2(content: ImessageServiceType): Promise<void> {
    return ApiUnSupport();
  }
}
