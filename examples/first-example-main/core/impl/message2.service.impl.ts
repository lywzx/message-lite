import { ImessageServiceType, Message2Service } from '@example/first-example-decl';
import { showAntdMessage } from './message.service.impl';
import { ApiImpl } from 'message-lite';

const message2Prefix = 'message2';

@ApiImpl()
export class Message2ServiceImpl extends Message2Service {
  info(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'info', message2Prefix);
  }

  info2(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content + 'info2', 'info', message2Prefix);
  }

  success(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'success', message2Prefix);
  }

  error(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'error', message2Prefix);
  }

  warning(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'warning', message2Prefix);
  }

  warn(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'warn', message2Prefix);
  }

  loading(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'loading', message2Prefix);
  }
}
