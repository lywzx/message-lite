import { TimeService } from '@example/first-example-decl';
import { ApiImpl } from 'message-lite';

@ApiImpl()
export class TimeServiceImpl extends TimeService {
  async getSystemTime(): Promise<{ now: string }> {
    return {
      now: new Date().toDateString(),
    };
  }
}
