import { ApiDecl, ApiDeclApi, ApiUnSupport, BaseService } from 'message-lite';

export interface IMessageOption {
  /**
   * 消息内容
   */
  content: string;
  /**
   * 执行续时间
   */
  duration?: number;
  /**
   * 一直等待到close时，才响应
   */
  waitingClose?: boolean;
}

export type ImessageServiceType = string | IMessageOption;

@ApiDecl({
  name: 'com.example.parent.message.service',
})
export class MessageService extends BaseService {
  @ApiDeclApi()
  info(content: ImessageServiceType): Promise<void> {
    return ApiUnSupport();
  }
}