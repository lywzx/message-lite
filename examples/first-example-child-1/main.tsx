import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './app/App';

export default () => {
  ReactDOM.render(<App />, document.querySelector('#app'));
};
