import { IMessageBaseData } from '../interfaces';
import {
  CONST_SERVICE_NAME,
  EMessageTypeCall,
  EMessageTypeEvent,
  EMessageTypeEventOff,
  EMessageTypeEventOn,
  EMessageTypeGoodBye,
  EMessageTypeHandshake,
  EMessageTypeResponse,
  EMessageTypeResponseException,
} from '../constant';

export function messageHelper(data: any): data is IMessageBaseData {
  return (
    data &&
    typeof data === 'object' &&
    data.channel &&
    [
      EMessageTypeHandshake,
      EMessageTypeGoodBye,
      EMessageTypeCall,
      EMessageTypeResponse,
      EMessageTypeResponseException,
      EMessageTypeEvent,
      EMessageTypeEventOn,
      EMessageTypeEventOff,
    ].includes(data.type)
  );
}

/**
 * 根据消息生成对应的响应事件名称
 * @param message
 * @param withSubPrefix
 */
export function createMessageEventName(
  message: {
    type?: number;
    service: string;
    event?: string;
    method?: string;
  },
  withSubPrefix = true
) {
  const { type, service, event, method } = message;
  const eventName: string[] = [service, (event || method)!];
  if (withSubPrefix && type) {
    if (type === EMessageTypeEventOn) {
      eventName.push('on');
    } else if (type === EMessageTypeEventOff) {
      eventName.push('off');
    } else if (type === EMessageTypeCall) {
      if (service === CONST_SERVICE_NAME) {
        eventName.push('connect');
      }
      eventName.push('call');
    } else {
      eventName.push('emit');
    }
  }

  return eventName.join(':');
}
