import { ConnectSession } from './connect-session';

export class SlaveClient extends ConnectSession {
  disconnect(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
