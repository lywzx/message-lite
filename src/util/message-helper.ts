import { EMessageType, IMessageBaseData } from '../interfaces';
import { CONST_SERVICE_NAME } from '../connect/connect.service';

export function messageHelper(data: any): data is IMessageBaseData {
  return (
    data &&
    typeof data === 'object' &&
    data.channel &&
    [
      EMessageType.HANDSHAKE,
      EMessageType.GOOD_BYE,
      EMessageType.CALL,
      EMessageType.RESPONSE,
      EMessageType.RESPONSE_EXCEPTION,
      EMessageType.EVENT,
      EMessageType.EVENT_ON,
      EMessageType.EVENT_OFF,
    ].includes(data.type)
  );
}

/**
 * 根据消息生成对应的响应事件名称
 * @param message
 */
export function createMessageEventName(message: {
  type: EMessageType;
  service: string;
  event?: string;
  method?: string;
}) {
  const { type, service, event, method } = message;
  const eventName: string[] = [service, (event || method)!];
  if (type === EMessageType.EVENT_ON) {
    eventName.push('on');
  } else if (type === EMessageType.EVENT_OFF) {
    eventName.push('off');
  } else if (type === EMessageType.CALL) {
    if (service === CONST_SERVICE_NAME) {
      eventName.push('connect');
    }
    eventName.push('call');
  } else {
    eventName.push('emit');
  }

  return eventName.join(':');
}
