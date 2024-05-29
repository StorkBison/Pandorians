import React from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export default function Not_found () {
  const MySwal = withReactContent( Swal );
  function handleClick ( e ) {
    e.preventDefault();
    MySwal.fire( <p>Shorthand works too</p> );
  }
  return (
    <React.Fragment>
      <div className="head-block-404">
        <div className="block404">
          <img src="/assets/img/404/404.png" alt="" className="image-404" />
          <p className="block404-text-top-2">Page not found</p>
          <p className="block404-text-top-3">The page disappeared in pandora's box , go back to the main page.</p>
          <div onClick={handleClick} className="class_button_back">GO BACK</div>
        </div>
      </div>
    </React.Fragment>
  );
}
