import { ConnectService } from '../decl/connect.service';
import { ApiImpl } from '../../decorator';
import { IConnectSession } from '../../interfaces';
import { ESessionStateClosed, ESessionStateClosingWaitingSecondApprove, ESessionStateReady } from '../../constant';
import { IPromiseDefer, throwExceptionAsync } from '../../util';

const cacheMap = new WeakMap<any, IPromiseDefer<any>>();

export function setDefer(session: IConnectSession, defer?: IPromiseDefer<any>) {
  if (defer) {
    cacheMap.set(session, defer);
    defer.promise.finally(() => {
      cacheMap.delete(session);
    });
  } else {
    cacheMap.delete(session);
  }
}

export function getDefer(session: IConnectSession): IPromiseDefer<any> | undefined {
  debugger;
  return cacheMap.get(session);
}

@ApiImpl()
export class ConnectServiceImpl extends ConnectService {
  protected map = new Map();

  disconnect(message?: any, session?: IConnectSession): Promise<void> {
    if (![ESessionStateReady, ESessionStateClosingWaitingSecondApprove].includes(session!.getState())) {
      return throwExceptionAsync('client state is not correct, disconnect failed!');
    }
    (session as any)!.state = ESessionStateClosingWaitingSecondApprove;
    return Promise.resolve().finally(async () => {
      const service = session!.getService(ConnectService);
      await service.secondDisconnect();
    });
  }

  async secondDisconnect(message?: any, session?: IConnectSession): Promise<void> {
    const defer = getDefer(session!);
    if (session!.getState() !== ESessionStateClosingWaitingSecondApprove || !defer) {
      return throwExceptionAsync('client status not correct!');
    } else {
      Promise.resolve().then(() => defer.resolve());
    }

    defer.promise.finally(() => {
      (session as any).state = ESessionStateClosed;
      // (session as any).s = null;
      (session as any).messageContext.detachSession(session);
      session!.detachMessageContext();
    });

    return defer!.promise;
  }
}
