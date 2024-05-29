import React from 'react';
import ReactDOM from 'react-dom/client';
import '../node_modules/simplebar-react/dist/simplebar.min.css';
import './index.css';
import './assets/css/less/wheel.less';
import Main from './pages/Main';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot( document.getElementById( 'root' ) );
root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);

reportWebVitals();
