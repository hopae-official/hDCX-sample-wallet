import { useCallback, useEffect, useState } from "react";
import { Alert, Dimensions } from "react-native";
import { useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "expo-router";
import logger from "@/utils/logger";

const SCAN_AREA_SIZE = { width: 250, height: 250 };

type BarcodeEvent = {
  data: string;
  type: string;
  bounds: { origin: { x: number; y: number } };
};

export type ScanResult = {
  type: "verify" | "issue";
  uri: string;
  decodedUri?: string;
} | null;

type UseQRScannerProps = {
  onScanSuccess?: (result: ScanResult) => void;
  onScanError?: () => void;
};

export const useQRScanner = ({ onScanSuccess, onScanError }: UseQRScannerProps = {}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, [])
  );

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const isInScanArea = useCallback((x: number, y: number) => {
    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;

    const scanArea = {
      x: (screenWidth - SCAN_AREA_SIZE.width) / 2,
      y: (screenHeight - SCAN_AREA_SIZE.height) / 2,
      width: SCAN_AREA_SIZE.width,
      height: SCAN_AREA_SIZE.height,
    };

    return (
      x >= scanArea.x &&
      x <= scanArea.x + scanArea.width &&
      y >= scanArea.y &&
      y <= scanArea.y + scanArea.height
    );
  }, []);

  const handleBarcodeScanned = useCallback(
    async (event: BarcodeEvent) => {
      if (scanned) return;

      const { x, y } = event.bounds.origin;
      if (!isInScanArea(x, y)) return;

      setScanned(true);

      const uri = event.data;
      logger.log("Scanned URI:", uri);
      
      const verifyRegex = /request_uri=([^&]*)/;
      const verifyMatch = uri.match(verifyRegex);

      const issueRegex = /credential_offer_uri=([^&]+)/;
      const issueMatch = uri.match(issueRegex);

      if (verifyMatch && verifyMatch[1]) {
        const decodedUri = decodeURIComponent(verifyMatch[1]);
        onScanSuccess?.({
          type: "verify",
          uri,
          decodedUri,
        });
        return;
      }

      if (issueMatch && issueMatch[1]) {
        onScanSuccess?.({
          type: "issue",
          uri,
        });
        return;
      }

      Alert.alert("Credential offer URI not found");
      onScanError?.();
      setScanned(false);
    },
    [scanned, isInScanArea, onScanSuccess, onScanError]
  );

  return {
    permission,
    scanned,
    handleBarcodeScanned,
  };
};
