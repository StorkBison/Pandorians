import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getProvider } from "../../solana";

function useProvider () {
  const wallet = useWallet();

  // TODO: check if wallet can be removed from deps to create only one instance per using component
  return useMemo( () => getProvider( wallet ), [ wallet ] );
}

export default useProvider;
