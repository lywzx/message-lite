const PORT_CONNECTOR = '➜';

/**
 * create message port
 * @param name
 * @param port1
 * @param port2
 */
export function createPort(name: string, port1: number, port2: number) {
  return [name, port1, port2].join(PORT_CONNECTOR);
}

/**
 * parse port
 * @param port
 */
export function parsePort(port: string): { name: string; port1: number; port2: number } {
  return {
    name: '',
    port1: 0,
    port2: 0,
  };
}
