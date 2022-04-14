import { ConnectSession } from './connect-session';

export class MasterClient extends ConnectSession {
  disconnect(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
