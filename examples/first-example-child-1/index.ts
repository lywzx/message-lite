import './app.less';
import 'antd/dist/antd.css';
import render from './main';
import { slave } from './slave';
const url = new URL(location.href);

slave
  .connect({
    name: url.searchParams.get('id') || '',
  })
  .then(() => {
    render();
  });
