import { AppTestService } from '../decl';
import { ApiImpl } from '../../../src';

@ApiImpl()
export class AppTestImpl extends AppTestService {
  async currentTime(now?: number): Promise<number> {
    if (typeof now === 'number') {
      return now + 1;
    }
    return Date.now();
  }

  async notify() {
    return 2 as any;
  }
}
