import { sortBy } from 'lodash';
import { IApiDeclFullOption } from '../../src/util';

/**
 * 针对声明中的数组进行排序
 * @param decl
 */
export function declSort(decl: IApiDeclFullOption): IApiDeclFullOption {
  return {
    ...decl,
    events: sortBy(decl.events, ['name']),
    apis: sortBy(decl.apis, ['method']),
  };
}
