import { useCallback, useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getCredentialClaims } from "@/utils";
import { Alert } from "react-native";

type AnimoCredentialResponse = {
  credential: string;
};

type CredentialClaims = Record<string, string>;

export const useCredentialIssuanceFlow = (credentialOfferUri?: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [credential, setCredential] = useState<string | null>(null);
  const walletSDK = useWallet();

  const claims = credential
    ? (getCredentialClaims({
        credential,
        format: "dc+sd-jwt",
      }) as CredentialClaims)
    : null;

  const receiveCredential = useCallback(
    async (credentialOfferUri: string) => {
      try {
        setIsLoading(true);

        const { credential } = (await walletSDK.receive(
          credentialOfferUri
        )) as unknown as AnimoCredentialResponse;

        setCredential(credential);

        return {
          isSuccess: true,
        };
      } catch (error) {
        Alert.alert(
          "Failed to receive credential:",
          error instanceof Error
            ? error.message
            : "Failed to receive credential"
        );

        return {
          isSuccess: false,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [credentialOfferUri, walletSDK]
  );

  const saveCredential = useCallback(async () => {
    if (!credential) return;

    try {
      setIsLoading(true);

      await walletSDK.save({
        credential,
        format: "dc+sd-jwt",
      });

      return {
        isSuccess: true,
      };
    } catch (error) {
      Alert.alert(
        "Failed to save credential:",
        error instanceof Error ? error.message : "Failed to save credential"
      );

      return {
        isSuccess: false,
      };
    } finally {
      setIsLoading(false);
    }
  }, [credential, walletSDK]);

  return {
    isLoading,
    credential,
    claims,
    saveCredential,
    receiveCredential,
  };
};
