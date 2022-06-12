/**
 * generate uniqId
 */
export const uniqId = (() => {
  let init = 0;
  return () => ++init;
})();
