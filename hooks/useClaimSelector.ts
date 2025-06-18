import { useState } from "react";
import { StoredCredential } from "@/types";

export type ClaimSelectorOptions = {
  [key: string]: boolean;
};

export function useClaimSelector(
  credential: StoredCredential | null,
  requiredClaims: readonly string[] = []
) {
  const [selectedOptions, setSelectedOptions] = useState<ClaimSelectorOptions>(() => {
    if (!credential) return {};
    
    const initialOptions = Object.keys(credential).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {}
    );

    return {
      ...initialOptions,
      ...requiredClaims.reduce((acc, claim) => ({ ...acc, [claim]: true }), {}),
    };
  });

  const toggleOption = (option: keyof typeof selectedOptions) => {
    if (requiredClaims.includes(option as any)) return;

    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  return {
    selectedOptions,
    toggleOption,
  };
}
