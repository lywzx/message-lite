import { AppTestService } from '../decl';
import { ApiImpl } from '../../../src';

@ApiImpl()
export class AppTestImpl extends AppTestService {
  async currentTime(): Promise<number> {
    return Date.now();
  }

  async notify() {
    return 2 as any;
  }
}
