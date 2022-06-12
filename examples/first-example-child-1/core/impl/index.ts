import { AlertService } from '@example/first-children-decl';
import { AlertServiceImpl } from './alert.service.impl';


/**
 * 声明的所有服务
 */
export const ALL_SERVICE = [
  {
    decl: AlertService,
    impl: AlertServiceImpl,
  },
];
