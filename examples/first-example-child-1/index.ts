import './app.less';
import 'antd/dist/antd.css';
import { ALL_SERVICE } from './core/impl';
import render from './main';
import { slave } from './slave';

slave
  .connect({
    name: '',
  })
  .then(() => {
    render();
  });
