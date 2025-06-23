import { Stack, router } from "expo-router";
import { useCallback } from "react";
import { useQRScanner } from "@/hooks/useQRScanner";
import { QRScanner } from "@/components/QRScanner";
import type { ScanResult } from "@/hooks/useQRScanner";
import logger from "@/utils/logger";

export default function QRScanScreen() {
  const handleScanSuccess = useCallback((result: ScanResult) => {
    if (!result) return;

    if (result.type === "verify") {
      router.replace({
        pathname: "/SampleVerifier",
        params: { requestUri: result.uri },
      });
      return;
    }

    logger.error("Invalid QR code type");
    router.replace("/SampleVerifier");
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
