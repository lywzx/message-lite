import { getApiDeclInfo, IApiCallTimeout, IApiDeclFullOption } from '../../src/util';
import { ConnectService } from '../../src/connect/decl/connect.service';
import { expect } from 'chai';
import { ApiDecl, ApiDeclApi, ApiDeclEvent, ApiUnSupport, IEventer } from '../../src';

const connectServiceInfo: IApiDeclFullOption = {
  name: '$$message.inner.connect.service',
  apis: [
    {
      method: 'connect',
      timeout: 30000,
    },
    {
      method: 'disconnect',
    },
  ],
  events: [],
};

describe('#decorator test impl', () => {
  it('check connect service default data is ok ', function () {
    const result = getApiDeclInfo(ConnectService);
    expect(result).to.be.eql(connectServiceInfo);
  });

  it('should api decl name override', function () {
    const changeName = 'name.override';
    @ApiDecl({
      name: 'name.override',
    })
    class B extends ConnectService {}

    const result = getApiDeclInfo(B);
    expect(result).to.be.eql({
      ...connectServiceInfo,
      name: changeName,
    });
  });

  it('should api decl method or disconnect should override', function () {
    class C extends ConnectService {
      @ApiDeclApi()
      connect(id: string, option?: IApiCallTimeout): Promise<string> {
        return ApiUnSupport();
      }
    }
    const result = getApiDeclInfo(C);
    const apis = connectServiceInfo.apis.slice();
    apis.splice(0, 1, {
      method: 'connect',
    });
    expect(result).to.be.eql({
      ...connectServiceInfo,
      apis,
    });
  });

  it('should api decl new method should merge', function () {
    class D extends ConnectService {
      @ApiDeclApi()
      test(id: string, option?: IApiCallTimeout): Promise<string> {
        return ApiUnSupport();
      }
    }
    const result = getApiDeclInfo(D);
    expect(result).to.be.eql({
      ...connectServiceInfo,
      apis: [
        {
          method: 'test',
        },
        ...connectServiceInfo.apis,
      ],
    });
  });

  class C extends ConnectService {
    @ApiDeclEvent()
    public eventer: IEventer<any>;
  }

  it('should api decl event should override', function () {
    const onReturnTransform = {
      send: (a: any) => a,
      receive: (a: any) => a,
    };
    class D extends C {
      @ApiDeclEvent({
        onReturnTransform,
      })
      public eventer: IEventer<any>;
    }
    const result = getApiDeclInfo(D);
    const events = connectServiceInfo.events.slice();
    events.splice(0, 1, {
      name: 'eventer',
      onReturnTransform,
    });
    expect(result).to.be.eql({
      ...connectServiceInfo,
      events,
    });
  });

  it('should api decl new event should merge', function () {
    class E extends C {
      @ApiDeclEvent()
      public eventer1: IEventer<any>;
    }
    const result = getApiDeclInfo(E);
    expect(result).to.be.eql({
      ...connectServiceInfo,
      events: [
        {
          name: 'eventer1',
        },
        {
          name: 'eventer',
        },
      ],
    });
  });
});
