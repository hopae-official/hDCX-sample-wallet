import { useEffect, useState } from "react";
import { Device } from "react-native-ble-plx";
import { BleSdk } from "@/sdk/BleSdk";
import logger from "@/utils/logger";
import { useWallet } from "@/contexts/WalletContext";

const SERVICE_UUID = "4FAFC201-1FB5-459E-8FCC-C5C9C331914B";
const CHARACTERISTIC_UUID = "BEB5483E-36E1-4688-B7F5-EA07361B26A8";

interface UseBleConnectionProps {
  onReceiveRequestObject: (value: any) => void;
  onReceivePresentationResult: () => void;
}

export function useBleConnection({
  onReceiveRequestObject,
  onReceivePresentationResult,
}: UseBleConnectionProps) {
  const walletSDK = useWallet();
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    const init = async () => {
      const isEnabled = await walletSDK.bleService.checkPermissions();
      if (!isEnabled) {
        logger.error("Bluetooth is not enabled");
        return;
      }

      walletSDK.bleService.setConnectionStatusCallback((status, device) => {
        setIsScanning(status === "scanning");
        if (status === "connected" && device) {
          setConnectedDevice(device);
          // Send initial ack when connected
          walletSDK.bleService
            .sendData(JSON.stringify({ type: "ack" }))
            .catch((error) => {
              logger.error("Failed to send ack:", error);
            });
        } else if (status === "disconnected") {
          setConnectedDevice(null);
        }
      });

      try {
        await walletSDK.bleService.scanAndConnect({
          serviceUUID: SERVICE_UUID,
          characteristicUUID: CHARACTERISTIC_UUID,
        });
      } catch (error) {
        logger.error("BLE operation failed:", error);
      }
    };

    init();

    return () => {
      walletSDK.bleService.destroy();
    };
  }, []);

  useEffect(() => {
    if (connectedDevice) {
      walletSDK.bleService.monitorCharacteristic((error, data) => {
        if (error) {
          logger.error("Monitoring error:", error);
          return;
        }

        if (!data) return;

        try {
          if (data.trim().startsWith("{") || data.trim().startsWith("[")) {
            const jsonData = JSON.parse(data);

            if (jsonData.type === "request_object") {
              onReceiveRequestObject(jsonData.value);
            }

            if (jsonData.type === "presentation_result") {
              onReceivePresentationResult();
            }
          }
        } catch (error) {
          logger.error("Error processing data:", error);
        }
      });
    }
  }, [connectedDevice]);

  const sendDataViaBLE = async (data: string) => {
    try {
      await walletSDK.bleService.sendData(data);
    } catch (error) {
      logger.error("Failed to send data:", error);
    }
  };

  return {
    isScanning,
    connectedDevice,
    sendDataViaBLE,
  };
}
