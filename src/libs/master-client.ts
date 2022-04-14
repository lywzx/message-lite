debugger;
import { ConnectSession } from './connect-session';
console.log(11111);
debugger;
export class MasterClient extends ConnectSession {
  disconnect(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
