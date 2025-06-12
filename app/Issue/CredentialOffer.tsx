import { router, Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";

const jwk = {
  kty: "EC",
  d: "hUQznqxINndxBHI8hMHvQmgSjYOCSqLUwMtzWCrh4ow",
  crv: "P-256",
  x: "ifSgGMkEIEDPsxFxdOjeJxhYsz0STsTT5bni_MXNEJs",
  y: "viFDEvB61K6zuj2iq23j0FCmVYYQ8tGJ_3f35XXUDZ0",
} as const;

type AnimoCredentialResponse = {
  credential: string;
};

export default function CredentialOfferScreen() {
  const { credentialOfferUri } = useLocalSearchParams<{
    credentialOfferUri: string;
  }>();
  const walletSDK = useWallet();

  useEffect(() => {
    if (!credentialOfferUri || !walletSDK) return;

    (async function receiveCredential() {
      // @Todo: fix type (Animo credential response does not match with type)
      const { credential } = (await walletSDK.receive(
        credentialOfferUri
      )) as unknown as AnimoCredentialResponse;

      // @Todo: Remove the mock credential type
      router.replace({
        pathname: "/Issue/CredentialConfirm",
        params: { credential: credential, type: "FunkeAnimo" },
      });
    })();
  }, [credentialOfferUri, walletSDK]);

  return (
    <>
      <Stack.Screen options={{ title: "Receiving Credential" }} />
      <ThemedView style={styles.container}>
        <ActivityIndicator
          style={styles.loadingSpinner}
          color={"black"}
          size="large"
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  descWrapper: {
    gap: 8,
    borderColor: "black",
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    height: 400,
    justifyContent: "center",
  },
  descText: {
    fontSize: 16,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  loadingSpinner: {
    marginTop: 20,
  },
});
