function useGTag () {
  return ( ...args ) => {
    if ( !process.browser || !( 'gtag' in window ) ) return;
    window.gtag( ...args );
  };
}

export default useGTag;
