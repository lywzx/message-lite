import { uniqId } from './random';

/**
 * sender message info
 */
export function sendInitMessage(base: number = Date.now(), offset = uniqId(), init = true): string {
  const anchor = init ? '♨' : '☂';
  return `${anchor}${base}-${offset.toString().padStart(6, '0')}◌❃`;
}

const handshakeMessage = /^([♨☂☼])(\d+)-(\d{5,})◌❃$/;
/**
 * check message is handshake message
 * @param message
 */
export function isHandshakeMessage(message: any): boolean {
  if (typeof message === 'string') {
    return handshakeMessage.test(message);
  }
  return false;
}

export enum EHandshakeMessageType {
  /**
   * init message
   */
  INIT,
  /**
   * response message
   */
  RES,
}

export interface IHandshakeMessage {
  /**
   * message type
   */
  type: EHandshakeMessageType;
  /**
   * base number
   */
  base: number;
  /**
   * offset number
   */
  offset: number;
}

/**
 *
 * @param message
 */
export function parseHandshakeMessage(message: string): IHandshakeMessage | undefined {
  if (isHandshakeMessage(message)) {
    const value = message.match(handshakeMessage)!;
    return {
      type: value[1] === '♨' ? EHandshakeMessageType.INIT : EHandshakeMessageType.RES,
      base: parseInt(value[2]),
      offset: parseInt(value[3]),
    };
  }
}

/**
 * send handshake response message
 *
 * @param message
 */
export function sendHandshakeResponseMessage(message: string): string {
  const parseResult = parseHandshakeMessage(message)!;
  return sendInitMessage(parseResult.base + parseResult.offset + 1, uniqId(), false);
}

/**
 * check message is from self
 *
 * @param initMessage
 * @param responseMessage
 * @param limit
 */
export function checkReceiveIsMatchInitMessage(initMessage: string, responseMessage: string, limit?: number): boolean {
  const init = parseHandshakeMessage(initMessage);
  const receiver = parseHandshakeMessage(responseMessage);
  if (init && receiver) {
    if (limit !== undefined && Date.now() - init.base > limit) {
      return false;
    }
    return receiver.base === init.base + init.offset + 1;
  }
  return false;
}
