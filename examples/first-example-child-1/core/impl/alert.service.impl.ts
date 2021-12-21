import { AlertService } from '@example/first-children-decl';
import { ApiImpl } from 'message-lite';

@ApiImpl()
export class AlertServiceImpl extends AlertService {
  async alert(message: string) {
    alert(message);
  }
}
