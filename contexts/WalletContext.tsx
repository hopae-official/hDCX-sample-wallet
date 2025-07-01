import { ExpoSecureStore, WalletSDK } from "@hdcx/wallet-core";
import { createContext, useContext, ReactNode } from "react";

const jwk = {
  kty: "EC",
  d: "hUQznqxINndxBHI8hMHvQmgSjYOCSqLUwMtzWCrh4ow",
  crv: "P-256",
  x: "ifSgGMkEIEDPsxFxdOjeJxhYsz0STsTT5bni_MXNEJs",
  y: "viFDEvB61K6zuj2iq23j0FCmVYYQ8tGJ_3f35XXUDZ0",
} as const;

const walletSDK = new WalletSDK({
  storage: new ExpoSecureStore(),
  jwk,
});

const WalletContext = createContext<WalletSDK | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WalletContext.Provider value={walletSDK}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
