import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { RequestObject, StoredCredential } from "@/types";
import { useWallet } from "@/contexts/WalletContext";
import { useAsyncAction } from "./useAsyncAction";

const REQUIRED_CLAIMS = ["iss", "vct"] as const;
const PRESENTATION_FRAME = {
  family_name: true,
  given_name: true,
  birth_date: true,
  age_over_18: true,
  issuance_date: true,
  expiry_date: true,
  issuing_country: true,
  issuing_authority: true,
} as const;

export function useVerificationFlow(requestUri?: string) {
  const walletSDK = useWallet();
  const [requestObject, setRequestObject] = useState<RequestObject>();

  const { isLoading, withLoading } = useAsyncAction({
    errorTitle: "Load Request Error",
  });

  const loadRequestObject = useCallback(async () => {
    if (!requestUri) {
      throw new Error("Cannot load request object: Missing request URI");
    }

    return withLoading(async () => {
      const reqObject = await walletSDK.load(requestUri);
      setRequestObject(reqObject);
      return { isSuccess: true };
    }, "Failed to load request object");
  }, [requestUri, walletSDK, withLoading]);

  const loadCredentials = useCallback(async () => {
    if (!requestObject) return [];

    try {
      const storedCredentials = await walletSDK.selectCredentials();
      return storedCredentials ? JSON.parse(storedCredentials) : [];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load credentials";
      Alert.alert("Error:", errorMessage);
      return [];
    }
  }, [requestObject, walletSDK]);

  const presentCredential = useCallback(
    async (
      credential: StoredCredential
    ): Promise<{
      isSuccess: boolean;
      error?: string;
    }> => {
      if (!walletSDK || !credential?.raw || !requestObject)
        throw new Error(
          "Cannot present credential: Missing required data. Please ensure wallet is initialized and credential is valid."
        );

      try {
        const result = await walletSDK.present(
          credential.raw,
          PRESENTATION_FRAME,
          requestObject
        );

        return {
          isSuccess: !!result,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to verify credential";

        Alert.alert("Error:", errorMessage);
        return {
          isSuccess: false,
          error: errorMessage,
        };
      }
    },
    [walletSDK, requestObject]
  );

  return {
    isLoading,
    requestObject,
    loadRequestObject,
    loadCredentials,
    presentCredential,
    REQUIRED_CLAIMS,
    PRESENTATION_FRAME,
  };
}
