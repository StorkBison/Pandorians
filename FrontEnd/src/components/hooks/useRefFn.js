import { useRef } from 'react';

const SENTINEL = {};

function useRefFn ( init ) {
  const ref = useRef( SENTINEL );
  if ( ref.current === SENTINEL ) {
    ref.current = init();
  }
  return ref;
}

export default useRefFn;
