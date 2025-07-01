import { useState, useEffect } from "react";
import { StoredCredential } from "@/types";

export type ClaimSelectorOptions = {
  [key: string]: boolean;
};

export function useClaimSelector(
  credential: StoredCredential | null,
  requiredClaims: readonly string[] = []
) {
  const [selectedOptions, setSelectedOptions] = useState<ClaimSelectorOptions>(
    {}
  );

  useEffect(() => {
    if (!credential) return;

    const initialOptions = Object.keys(credential)
      .filter((key) => key !== "raw" && key !== "cnf")
      .reduce<ClaimSelectorOptions>((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});

    requiredClaims.forEach((claim) => {
      initialOptions[claim] = true;
    });

    setSelectedOptions(initialOptions);
  }, [credential, requiredClaims]);

  const toggleOption = (option: string) => {
    if (requiredClaims.includes(option)) return;

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
