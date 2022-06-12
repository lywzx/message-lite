import { MessageService } from '@example/first-example-decl';
import { MessageServiceImpl } from './message.service.impl';

/**
 * 声明的所有服务
 */
export const ALL_SERVICE = [
  {
    decl: MessageService,
    impl: MessageServiceImpl,
  },
];
