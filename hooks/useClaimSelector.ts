import { useState, useEffect, useCallback } from "react";
import { StoredCredential } from "@/types";
import { useWallet } from "@/contexts/WalletContext";
import { rawDCQL } from "@vdcs/dcql";

export type ClaimSelectorOptions = {
  [key: string]: boolean;
};

export function useClaimSelector(
  credential: StoredCredential | null,
  query: rawDCQL
) {
  const walletSDK = useWallet();

  const [selectedOptions, setSelectedOptions] = useState<ClaimSelectorOptions>(
    {}
  );

  useEffect(() => {
    const { initialOptions } = walletSDK.sdService.initialize(
      credential,
      query
    );
    setSelectedOptions(initialOptions);
  }, [credential, walletSDK]);

  const toggleOption = useCallback(
    (option: string) => {
      const updated = walletSDK.sdService.toggle(option);
      setSelectedOptions(updated);
    },
    [walletSDK]
  );

  return {
    selectedOptions,
    toggleOption,
  };
}
