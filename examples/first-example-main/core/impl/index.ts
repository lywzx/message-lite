import { Message2Service, MessageService, TimeService } from '@example/first-example-decl';
import { MessageServiceImpl } from './message.service.impl';
import { Message2ServiceImpl } from './message2.service.impl';
import { IAddService } from 'message-lite';
import { TimeServiceImpl } from './time.service.impl';

/**
 * 服务声明
 */

/**
 * 声明的所有服务
 */
export const ALL_SERVICE: IAddService[] = [
  {
    decl: Message2Service,
    impl: Message2ServiceImpl,
  },
  {
    decl: MessageService,
    impl: MessageServiceImpl,
  },
  {
    decl: TimeService,
    impl: TimeServiceImpl,
  },
];
