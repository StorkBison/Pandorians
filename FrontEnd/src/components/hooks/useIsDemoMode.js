import { useSearchParams } from "react-router-dom";

function useIsDemoMode () {
  const [ searchParams ] = useSearchParams();
  return searchParams.get( 'demo' ) !== null;
}

export default useIsDemoMode;
