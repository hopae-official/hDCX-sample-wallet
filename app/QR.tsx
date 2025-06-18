import { Stack, router } from "expo-router";
import { useCallback } from "react";
import { useQRScanner } from "@/hooks/useQRScanner";
import { QRScanner } from "@/components/QRScanner";
import type { ScanResult } from "@/hooks/useQRScanner";

export default function QRScanScreen() {
  const handleScanSuccess = useCallback((result: ScanResult) => {
    if (!result) return;

    if (result.type === "verify") {
      router.navigate({
        pathname: "/Verify/CredentialPresentation",
        params: { requestUri: result.uri },
      });
      return;
    }

    if (result.type === "issue") {
      router.replace({
        pathname: "/Issue/CredentialIssuance",
        params: { credentialOfferUri: result.uri },
      });
    }
  }, []);

  const { permission, handleBarcodeScanned } = useQRScanner({
    onScanSuccess: handleScanSuccess,
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <QRScanner
        onBarcodeScanned={handleBarcodeScanned}
        isLoading={!!permission && !permission.granted}
      />
    </>
  );
}
