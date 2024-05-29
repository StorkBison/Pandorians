function useYMetrika () {
  return ( ...args ) => {
    if ( !process.browser || !( 'ym' in window ) ) return;
    window.ym( 94297964, ...args );
  };
}

export default useYMetrika;
