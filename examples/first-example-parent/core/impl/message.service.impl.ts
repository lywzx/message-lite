import { IMessageOption, ImessageServiceType, MessageService } from '@example/first-example-parent-decl';
import { message as antdMessage } from 'antd';
import { isString } from 'lodash';
import { defer } from 'message-lite/util';
import { ApiImpl } from 'message-lite';

function transformMessage(content: ImessageServiceType): IMessageOption {
  if (isString(content)) {
    return {
      content,
    };
  }
  return content;
}

function showAntdMessage(
  content: ImessageServiceType,
  type: 'info' | 'success' | 'error' | 'warning' | 'warn' | 'loading'
) {
  const option = transformMessage(content);
  let onClose: undefined | (() => void);
  const deferObj = defer<void>();

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
  info(content: ImessageServiceType): Promise<void> {
    return showAntdMessage(content, 'info');
  }
}
