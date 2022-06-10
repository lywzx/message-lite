import { IMessageOption, ImessageServiceType, MessageService } from '@example/first-example-decl';
import { message as antdMessage } from 'antd';
import { isString } from 'lodash';
import { ApiImpl } from 'message-lite';
import { createDefer } from 'message-lite/util';

export function applyPrefix(content: string, prefix?: string) {
  return `${prefix ? prefix + ': ' : ''}${content}`;
}

export function transformMessage(content: ImessageServiceType, prefix = ''): IMessageOption {
  if (isString(content)) {
    const newContent = applyPrefix(content, prefix);
    return {
      content: newContent,
    };
  }
  return {
    ...content,
    content: applyPrefix(content.content, prefix),
  };
}

export function showAntdMessage(
  content: ImessageServiceType,
  type: 'info' | 'success' | 'error' | 'warning' | 'warn' | 'loading',
  prefix = 'message1'
) {
  const option = transformMessage(content, prefix);
  let onClose: undefined | (() => void);
  const deferObj = createDefer<void>();
  if (option.waitingClose) {
    onClose = () => {
      deferObj.resolve();
    };
  } else {
    deferObj.resolve();
  }
  antdMessage[type](option.content, option.duration, onClose);
  return deferObj.promise;
}

@ApiImpl()
export class MessageServiceImpl extends MessageService {
  info(content: ImessageServiceType, context?: any): Promise<void> {
    if (context) {
      // tslint:disable-next-line:no-console
      console.log('RPC执行上下文', context.extData, context);
    }
    return showAntdMessage(content, 'info');
  }

  success(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'success');
  }

  error(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'error');
  }

  warning(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'warning');
  }

  warn(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'warn');
  }

  loading(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'loading');
  }
}
