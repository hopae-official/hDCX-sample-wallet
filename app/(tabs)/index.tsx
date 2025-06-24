import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  PermissionsAndroid,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useEffect } from "react";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "@/components/ui/button";
import { Claim } from "@/types";
import { useWallet } from "@/contexts/WalletContext";
import logger from "../../utils/logger";
import { CredentialCard } from "@/components/CredentialCard";
import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";
import { BleManager, Device } from "react-native-ble-plx";
import base64 from "react-native-base64";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { readNdef } from "@/utils/nfc";

// Initialize BLE manager for central mode
const bleManager = new BleManager();
const SERVICE_UUID = "4FAFC201-1FB5-459E-8FCC-C5C9C331914B";
const CHARACTERISTIC_UUID = "BEB5483E-36E1-4688-B7F5-EA07361B26A8";
const DEVICE_NAME = "HDCXWallet";

export default function HomeScreen() {
  const walletSDK = useWallet();
  const [credentials, setCredentials] = useState<Claim[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const [subscription, setSubscription] = useState<any>(null);
  const [ready, setReady] = useState(false);

  // Request permissions
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

  // Function to start scanning for peripherals
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

      bleManager.startDeviceScan(
        [SERVICE_UUID],
        null,
        async (error, device) => {
          console.log("device", device);
          if (error) {
            console.error("Scanning error:", error);
            setIsScanning(false);
            return;
          }

          if (
            device &&
            device.localName === DEVICE_NAME &&
            device.isConnectable
          ) {
            console.log("connect!!!!!!!!!!!!!!!");

            await connectToDevice(device);
            bleManager.stopDeviceScan();
          }
        }
      );

      // Stop scanning after 10 seconds
      setTimeout(() => {
        bleManager.stopDeviceScan();
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      console.error("Scan error:", error);
      setIsScanning(false);
    }
  };

  // Function to connect to a peripheral
  const connectToDevice = async (device: Device) => {
    try {
      console.log(" Connecting to device:", device.name);
      const connectedDevice = await device.connect();
      setConnectedDevice(connectedDevice);

      console.log(" Discovering services and characteristics");
      const discoveredDevice =
        await connectedDevice.discoverAllServicesAndCharacteristics();

      // 모니터링 설정
      setupCharacteristicMonitoring(discoveredDevice);

      console.log(" Connected to device");

      setReady(true);
    } catch (error) {
      console.error(" Connection error:", error);
      Alert.alert("Error", "Failed to connect to device");
    }
  };

  const setupCharacteristicMonitoring = async (discoveredDevice: Device) => {
    console.log(" Setting up characteristic monitoring");

    try {
      // 먼저 notification을 활성화
      console.log(" Enabling notifications...");
      await discoveredDevice.writeCharacteristicWithoutResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64.encode("01") // Enable notifications (hex string "01")
      );

      console.log(" Notifications enabled, setting up monitoring...");

      // 새로운 구독 설정
      const newSubscription = discoveredDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error(" Monitoring error:", error, error.reason);
            return;
          }

          console.log(" Characteristic update received:", characteristic);

          if (characteristic?.value) {
            try {
              console.log(" Raw received value:", characteristic.value);
              const decodedData = base64.decode(characteristic.value);
              console.log(" Received notification from peripheral:");
              console.log(" - Base64 encoded:", characteristic.value);
              console.log(" - Decoded data:", decodedData);
              // Alert.alert("Received Data", decodedData);
            } catch (decodeError) {
              console.error(" Error decoding data:", decodeError);
            }
          } else {
            console.log(" No value in characteristic update");
          }
        }
      );

      setSubscription(newSubscription);
      console.log(" New characteristic monitoring subscription created");
    } catch (error) {
      console.error(" Failed to setup characteristic monitoring:", error);
    }
  };

  // 컴포넌트 언마운트 시 구독 정리
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.remove();
        setSubscription(null);
        console.log(" Characteristic monitoring subscription cleaned up");
      }
    };
  }, [subscription]);

  // 연결 해제 시 구독 정리
  useEffect(() => {
    if (!connectedDevice && subscription) {
      subscription.remove();
      setSubscription(null);
      console.log(
        " Characteristic monitoring subscription removed due to device disconnection"
      );
    }
  }, [connectedDevice, subscription]);

  // Function to send data to connected device
  const sendData = async (data: string) => {
    console.log("Sending data:", data);
    if (!connectedDevice) {
      Alert.alert("Error", "No device connected");
      return;
    }

    try {
      const encodedData = base64.encode(data);
      console.log("encodedData", encodedData);
      await connectedDevice.writeCharacteristicWithoutResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        encodedData
      );
      console.log("Data sent successfully");
    } catch (error) {
      console.error("Send data error:", error);
      Alert.alert("Error", "Failed to send data");
    }
  };

  // Read characteristic 함수 추가
  const readCharacteristic = async () => {
    if (!connectedDevice) {
      console.log(" No device connected");
      return;
    }

    try {
      console.log(" Reading characteristic value...");

      const characteristic = await connectedDevice.readCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID
      );

      if (characteristic?.value) {
        const decodedData = base64.decode(characteristic.value);
        console.log(" Read value:", decodedData);
        Alert.alert("Read Value", decodedData);
      }
    } catch (error) {
      console.error(" Error reading characteristic:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async function loadCredentials() {
        try {
          const storedCredentials = JSON.parse(
            await walletSDK.selectCredentials()
          );

          setCredentials(storedCredentials);
        } catch (e) {
          logger.error(e);
        }
      })();
    }, [])
  );

  const handlePressCredential = (credential: Record<string, unknown>) => {
    router.navigate({
      pathname: "/Issue/CredentialDetail",
      params: { credential: JSON.stringify(credential) },
    });
  };

  const handlePressAddCredential = () => {
    router.navigate({
      pathname: "/QR",
    });
  };

  const handleScanTag = async () => {
    const result = await readNdef();
    if (!result) return;

    const verifyRegex = /request_uri=([^&]*)/;
    const verifyMatch = result.match(verifyRegex);

    if (verifyMatch && verifyMatch[1]) {
      router.push({
        pathname: "/Proximity",
        params: { requestUri: result },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {credentials.length > 0 ? (
        <View style={styles.listContainer}>
          <TouchableOpacity
            style={styles.addCredentialButton}
            onPress={handlePressAddCredential}
          >
            <Ionicons size={25} name="add" color={"white"} />
          </TouchableOpacity>

          <View style={styles.stackContainer}>
            {credentials.map((credential, index) => (
              <CredentialCard
                key={index}
                issuer={credential.iss}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                top={index * CARD_OFFSET}
                zIndex={credentials.length + index}
                onPress={() => handlePressCredential(credential)}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.nfcButton} onPress={handleScanTag}>
            <Ionicons size={25} name="scan" color={"white"} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons size={80} name="wallet-outline" />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginTop: 20,
              padding: 20,
            }}
          >
            Welcome
          </Text>
          <Text style={{ fontSize: 13, color: "gray", textAlign: "center" }}>
            You don't have any credentials yet. To add your first credential,
            tap the button
          </Text>
          <Button
            variant="default"
            className="w-full shadow shadow-foreground/5 mt-5"
            style={{ width: "100%", backgroundColor: Colors.light.orange }}
            onPress={() => router.navigate("/QR")}
          >
            <Text style={{ color: "white" }}>Add a credential</Text>
          </Button>

          <View style={styles.bleContainer}>
            <Button
              variant="default"
              style={[
                styles.bleButton,
                { backgroundColor: isScanning ? Colors.light.orange : "blue" },
              ]}
              onPress={startScanning}
            >
              <Text style={{ color: "white" }}>Scan for Devices</Text>
            </Button>
            {connectedDevice && (
              <Button
                variant="default"
                style={styles.bleButton}
                onPress={() => sendData(JSON.stringify({ type: "ack" }))}
              >
                <Text style={{ color: "white" }}>Send Test Message</Text>
              </Button>
            )}

            {connectedDevice && (
              <Button
                variant="default"
                style={styles.bleButton}
                onPress={() =>
                  sendData(
                    JSON.stringify({
                      type: "data",
                      value: "Hello from HDCX Wallet!",
                    })
                  )
                }
              >
                <Text style={{ color: "white" }}>Send Test Message22</Text>
              </Button>
            )}
            {connectedDevice && (
              <Button
                variant="default"
                style={styles.bleButton}
                onPress={readCharacteristic}
              >
                <Text style={{ color: "white" }}>Read Value</Text>
              </Button>
            )}
            <Button
              variant="default"
              style={styles.bleButton}
              onPress={handleScanTag}
            >
              <Text style={{ color: "white" }}>Scan A Tag</Text>
            </Button>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const CARD_OFFSET = 53;
const CARD_WIDTH = 350;
const CARD_HEIGHT = CARD_WIDTH / 1.58;

const styles = StyleSheet.create({
  addCredentialButton: {
    position: "absolute",
    top: 30,
    right: 30,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.orange,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  stackContainer: {
    width: CARD_WIDTH,
    position: "relative",
    marginTop: 100,
  },
  listContainer: {
    flex: 1,
    alignItems: "center",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 20,
  },
  bleContainer: {
    marginTop: 20,
    gap: 10,
    width: "100%",
  },
  bleButton: {
    width: "100%",
    marginVertical: 5,
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  nfcButton: {
    position: "absolute",
    bottom: 0,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: Colors.light.lightBlue,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});
