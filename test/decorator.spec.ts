import { getApiDeclInfo, IApiCallTimeout, IApiDeclFullOption } from '../src/util';
import { ConnectService } from './libs/connect.service';
import { expect } from 'chai';
import { ApiDecl, ApiDeclApi, ApiDeclEvent, ApiImpl, ApiUnSupport, MBaseService, IEventer } from '../src';
import { declSort } from './libs/helper';

const connectServiceInfo: IApiDeclFullOption = declSort({
  name: '$$__message.inner.connect.service__$$',
  apis: [
    {
      notify: true,
      method: 'preConnect',
    },
    {
      notify: true,
      method: 'connect',
    },
    {
      method: 'preDisConnect',
    },
    {
      notify: true,
      method: 'disconnect',
    },
  ],
  events: [],
});

describe('#decorator test impl', () => {
  it('check connect service default data is ok ', function () {
    const result = getApiDeclInfo(ConnectService);
    expect(declSort(result)).to.be.eql(connectServiceInfo);
  });

  it('ApiDecl decorator service should extends BaseService', function () {
    expect(() => {
      @ApiDecl({
        name: '1',
      })
      // eslint-disable-next-line no-unused-vars
      class Test {}
    }).to.be.throw();
  });

  it('should api decl name override', function () {
    const changeName = 'name.override';
    @ApiDecl({
      name: 'name.override',
    })
    class B extends ConnectService {}

    const result = getApiDeclInfo(B);
    expect(declSort(result)).to.be.eql(
      declSort({
        ...connectServiceInfo,
        name: changeName,
      })
    );
  });

  it('should api decl method or disconnect should override', function () {
    class C extends ConnectService {
      @ApiDeclApi()
      connect(id: string, option?: IApiCallTimeout) {
        return ApiUnSupport();
      }
    }
    const result = declSort(getApiDeclInfo(C));
    const apis = connectServiceInfo.apis.slice();
    apis.splice(0, 1, {
      method: 'connect',
    });
    expect(result).to.be.eql(
      declSort({
        ...connectServiceInfo,
        apis,
      })
    );
  });

  it('should api decl new method should merge', function () {
    class D extends ConnectService {
      @ApiDeclApi()
      test(id: string, option?: IApiCallTimeout): Promise<string> {
        return ApiUnSupport();
      }
    }
    const result = declSort(getApiDeclInfo(D));
    expect(result).to.be.eql(
      declSort({
        ...connectServiceInfo,
        apis: [
          {
            method: 'test',
          },
          ...connectServiceInfo.apis,
        ],
      })
    );
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
    const result = declSort(getApiDeclInfo(D));
    const events = connectServiceInfo.events.slice();
    events.splice(0, 1, {
      name: 'eventer',
      onReturnTransform,
    });
    expect(result).to.be.eql(
      declSort({
        ...connectServiceInfo,
        events,
      })
    );
  });

  it('should api decl new event should merge', function () {
    class E extends C {
      @ApiDeclEvent()
      public eventer1: IEventer<any>;
    }
    const result = declSort(getApiDeclInfo(E));
    expect(result).to.be.eql(
      declSort({
        ...connectServiceInfo,
        events: [
          {
            name: 'eventer1',
          },
          {
            name: 'eventer',
          },
        ],
      })
    );
  });

  it('impl should throw exception when not inherit BaseService', function () {
    expect(() => {
      @ApiImpl()
      // eslint-disable-next-line no-unused-vars
      class A {}
    }).to.be.throw('not extends ');
  });

  it('impl should throw exception when not decl', function () {
    expect(() => {
      @ApiImpl()
      // eslint-disable-next-line no-unused-vars
      class A extends MBaseService {}
    }).to.be.throw('can not find decl');
  });

  it('impl should throw exception when decl', function () {
    expect(() => {
      @ApiImpl()
      @ApiDecl({
        name: 'test',
      })
      // eslint-disable-next-line no-unused-vars
      class A extends MBaseService {}
    }).to.be.throw('should extends impl service');
  });

  it('impl should work', function () {
    expect(() => {
      @ApiImpl()
      // eslint-disable-next-line no-unused-vars
      class Test extends ConnectService {}
    }).to.not.throw();
  });
});
