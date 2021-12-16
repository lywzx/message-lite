let init = 0;
/**
 * generate uniqId
 * @param prefix
 */
export function uniqId(): number {
  return ++init;
}
