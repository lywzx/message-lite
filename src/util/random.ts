/**
 * number random
 * @param min
 * @param max
 */
export function randomNum(min: number, max: number): number {
  switch (arguments.length) {
    case 1:
      return parseInt(String(Math.random() * min + 1), 10);
    case 2:
      return parseInt(String(Math.random() * (max - min + 1) + min), 10);
  }
  return 0;
}

let init = 0;
/**
 * generate uniqId
 * @param prefix
 */
export function uniqId(): number {
  return ++init;
}
