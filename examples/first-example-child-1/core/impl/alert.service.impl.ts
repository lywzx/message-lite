import { AlertService } from '@example/first-children-decl';
import { ApiImpl } from 'message-lite';
import notification from 'antd/lib/notification';

@ApiImpl()
export class AlertServiceImpl extends AlertService {
  async alert(content: { message: string; description: string }) {
    notification.open(content);
  }
}
