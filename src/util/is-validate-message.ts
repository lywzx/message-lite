import { EMessageType, IMessageBaseData } from '../interfaces';

export function isValidateMessage(data: any): data is IMessageBaseData {
  return (
    data &&
    typeof data === 'object' &&
    data.channel &&
    [
      EMessageType.CALL,
      EMessageType.RESPONSE,
      EMessageType.RESPONSE_EXCEPTION,
      EMessageType.EVENT,
      EMessageType.EVENT_ON,
      EMessageType.EVENT_OFF,
    ].includes(data.type)
  );
}
