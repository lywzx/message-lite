import './app.less';
import 'antd/dist/antd.css';
import render from './main';
import { slave } from './slave';
import { PageEventService } from '@example/first-children-decl';
const url = new URL(location.href);

window.addEventListener('message', console.log.bind(console, '1111111111'), false);

slave
  .connect({
    name: url.searchParams.get('id') || '',
  })
  .then(() => {
    render();

    document.addEventListener(
      'click',
      (e) => {
        const eventer = slave.getService(PageEventService)!.onPageClientPos;
        eventer.emit({
          x: e.x,
          y: e.y,
        });
      },
      false
    );
  });
