import { IMessageOption, ImessageServiceType, MessageService } from '@example/first-example-decl';
import { message as antdMessage } from 'antd';
import { isString } from 'lodash';
import { ApiImpl } from 'message-lite';
import { createDefer } from 'message-lite/util';
import { IRpcContext } from 'message-lite';

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
  info(content: ImessageServiceType, context?: IRpcContext): Promise<void> {
    if (context) {
      console.log('RPC执行上下文', context);
      console.log(`来自客户端 ${context.clientId} 的调用`);
      console.log(`调用时间: ${new Date(context.timestamp).toLocaleString()}`);
      console.log(`服务: ${context.service}.${context.method}`);
    }
    return showAntdMessage(content, 'info');
  }

  success(content: ImessageServiceType, context?: IRpcContext): Promise<void> {
    if (context) {
      console.log(`成功消息来自客户端 ${context.clientId}`);
    }
    return showAntdMessage(content, 'success');
  }

  error(content: ImessageServiceType, context?: IRpcContext): Promise<void> {
    if (context) {
      console.log(`错误消息来自客户端 ${context.clientId}`);
    }
    return showAntdMessage(content, 'error');
  }

  warning(content: ImessageServiceType, context?: IRpcContext): Promise<void> {
    if (context) {
      console.log(`警告消息来自客户端 ${context.clientId}`);
    }
    return showAntdMessage(content, 'warning');
  }

  warn(content: ImessageServiceType, context?: IRpcContext): Promise<void> {
    if (context) {
      console.log(`警告消息来自客户端 ${context.clientId}`);
    }
    return showAntdMessage(content, 'warn');
  }

  loading(content: ImessageServiceType, context?: IRpcContext): Promise<void> {
    if (context) {
      console.log(`加载消息来自客户端 ${context.clientId}`);
    }
    return showAntdMessage(content, 'loading');
  }
}
