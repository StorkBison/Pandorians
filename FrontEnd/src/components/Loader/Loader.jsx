import React from 'react';
import './loader.scss';

function Loader() {
  return (
    <div className="spinner-wrapper">
      <div className="spinner">
        <div className="inner">
          <div className="gap" />
          <div className="left">
            <div className="half-circle" />
          </div>
          <div className="right">
            <div className="half-circle" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loader;
