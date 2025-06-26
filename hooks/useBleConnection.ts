import { useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import logger from "@/utils/logger";
import { useWallet } from "@/contexts/WalletContext";

const bleManager = new BleManager();
const DEVICE_NAME = "HDCXWallet";

interface UseBleConnectionProps {
  onReceiveRequestObject: (value: any) => void;
  onReceivePresentationResult: () => void;
}

export function useBleConnection({
  onReceiveRequestObject,
  onReceivePresentationResult,
}: UseBleConnectionProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const isSubscriptionActive = useRef(true);

  const walletSDK = useWallet();

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === "ios") {
        const status = await bleManager.state();
        if (status === "PoweredOff") {
          Alert.alert("Bluetooth is powered off", "Please enable Bluetooth");
          return;
        }
      }
    };

    requestPermissions();
    return () => {
      bleManager.destroy();
    };
  }, []);

  useEffect(() => {
    const startScanning = async () => {
      if (isScanning) return;

      try {
        setIsScanning(true);
        const status = await bleManager.state();

        if (status !== "PoweredOn") {
          logger.error("Bluetooth is powered off, please enable Bluetooth");
          setIsScanning(false);
          return;
        }

        bleManager.startDeviceScan(null, null, async (error, device) => {
          if (error) {
            logger.error("Scanning error:", error);
            setIsScanning(false);
            return;
          }

          if (device?.localName === DEVICE_NAME && device.isConnectable) {
            await connectToDevice(device);
            bleManager.stopDeviceScan();
            setIsScanning(false);
          }
        });

        // Stop scanning after 10 seconds
        setTimeout(() => {
          bleManager.stopDeviceScan();
          setIsScanning(false);
        }, 10000);
      } catch (error) {
        logger.error("Scan error:", error);
        setIsScanning(false);
      }
    };

    startScanning();
  }, []);

  useEffect(() => {
    isSubscriptionActive.current = true;

    return () => {
      isSubscriptionActive.current = false;
      if (subscription) {
        subscription.remove();
        setSubscription(null);
        setConnectedDevice(null);
        logger.log("Characteristic monitoring subscription cleaned up");
      }
    };
  }, [subscription]);

  useEffect(() => {
    if (connectedDevice && subscription) {
      logger.log("Device connected, sending ack");
      sendDataViaBLE(JSON.stringify({ type: "ack" }));
    }
  }, [connectedDevice, subscription]);

  useEffect(() => {
    if (!connectedDevice && subscription) {
      subscription.remove();
      setSubscription(null);
      logger.log("Subscription removed due to device disconnection");
    }
  }, [connectedDevice, subscription]);

  const connectToDevice = async (device: Device) => {
    try {
      logger.log("Connecting to device:", device.name);
      const connectedDevice = await device.connect();
      setConnectedDevice(connectedDevice);

      logger.log("Discovering services and characteristics");
      const discoveredDevice =
        await connectedDevice.discoverAllServicesAndCharacteristics();

      setupCharacteristicMonitoring(discoveredDevice);
      logger.log("Connected to device");
    } catch (error) {
      logger.error("Connection error:", error);
      Alert.alert("Error", "Failed to connect to device");
    }
  };

  const setupCharacteristicMonitoring = async (discoveredDevice: Device) => {
    try {
      const newSubscription = walletSDK.bleService.monitorCharacteristic(
        discoveredDevice,
        (error, data) => {
          if (!isSubscriptionActive.current) {
            return;
          }

          if (error) {
            if (error.message?.includes("Peripheral Disconnected")) {
              logger.error("Device disconnected:", error);
              setSubscription(null);
              setConnectedDevice(null);
              Alert.alert(
                "Connection Lost",
                "Device connection was lost. Please try reconnecting."
              );
            } else {
              logger.error("Monitoring stopped:", error);
            }
            return;
          }

          if (!data) {
            logger.log("No data received");
            return;
          }

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
        }
      );

      setSubscription(newSubscription);
      logger.log("Characteristic monitoring subscription created");
    } catch (error) {
      logger.error("Failed to setup characteristic monitoring:", error);
    }
  };

  const sendDataViaBLE = async (data: string) => {
    if (!connectedDevice) return;
    await walletSDK.bleService.sendData(connectedDevice, data);
  };

  return {
    isScanning,
    connectedDevice,
    sendDataViaBLE,
  };
}
