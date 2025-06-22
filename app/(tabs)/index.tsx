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
import Peripheral, { Characteristic, Service } from "react-native-peripheral";
import base64 from "react-native-base64";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Pre-step, call this before any NFC operations
NfcManager.start();

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
  const [isVerifierMode, setIsVerifierMode] = useState(false);

  useEffect(() => {
    const setupPeripheral = async () => {
      // Check verifier mode first
      const verifierMode = await AsyncStorage.getItem("verifier_mode");
      setIsVerifierMode(verifierMode === "true");

      if (verifierMode !== "true") {
        console.log("Peripheral mode disabled - not in verifier mode");
        return;
      }

      // Android BLE 권한 요청
      if (Platform.OS === "android") {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        ]);
      }

      Peripheral.onStateChanged(async (state) => {
        if (state === "poweredOn") {
          const char = new Characteristic({
            uuid: CHARACTERISTIC_UUID,
            value: base64.encode("initial"),
            permissions: ["readable", "writeable"],
            properties: ["read", "write", "notify"],
            onReadRequest: async () => {
              console.log("📥 Central read request received");
              return base64.encode("hello");
            },
            onWriteRequest: async (value) => {
              console.log("✍️ Received from Central:", base64.decode(value));
            },
          });

          const service = new Service({
            uuid: SERVICE_UUID,
            characteristics: [char],
          });

          await Peripheral.addService(service);
          await Peripheral.startAdvertising({
            name: DEVICE_NAME,
            serviceUuids: [SERVICE_UUID],
          });

          console.log("🟢 BLE Peripheral started in verifier mode");
        }
      });
    };

    setupPeripheral();
  }, []);

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
      console.log("Starting scan...");

      bleManager.startDeviceScan([SERVICE_UUID], null, async (error, device) => {
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
      });

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
      const connectedDevice = await device.connect();
      setConnectedDevice(connectedDevice);

      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log("Connected to device:", device.name);

      // Monitor for incoming data
      connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error("Monitoring error:", error);
            return;
          }
          if (characteristic?.value) {
            const decodedValue = Buffer.from(
              characteristic.value,
              "base64"
            ).toString();
            console.log("Received data:", decodedValue);
          }
        }
      );
    } catch (error) {
      console.error("Connection error:", error);
      Alert.alert("Error", "Failed to connect to device");
    }
  };

  // Function to send data to connected device
  const sendData = async (data: string) => {
    if (!connectedDevice) {
      Alert.alert("Error", "No device connected");
      return;
    }

    try {
      const encodedData = Buffer.from(data).toString("base64");
      await connectedDevice.writeCharacteristicWithResponseForService(
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

  async function readNdef() {
    try {
      // register for the NFC tag with NDEF in it
      await NfcManager.requestTechnology(NfcTech.Ndef);
      // the resolved tag object will contain `ndefMessage` property
      const tag = await NfcManager.getTag();

      if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
        // Get the first NDEF record
        const ndefRecord = tag.ndefMessage[0];

        // Decode the payload if it's a text record (TNF === 1 and type === [84] which is 'T')
        if (ndefRecord.tnf === 1 && ndefRecord.type[0] === 84) {
          const text = Ndef.text.decodePayload(ndefRecord.payload);
          console.log("[NFC] Decoded text:", text);
        }
      }
    } catch (ex) {
      console.warn("Oops!", ex, JSON.stringify(ex));
    } finally {
      // stop the nfc scanning
      NfcManager.cancelTechnologyRequest();
    }
  }

  async function writeNdef({ type, value }: { type: string; value: string }) {
    let result = false;

    try {
      // STEP 1: NFC 태그와의 통신을 시작
      console.log("[NFC] STEP 1: Requesting NFC technology...");
      await NfcManager.requestTechnology(NfcTech.Ndef);
      console.log("[NFC] STEP 1: NFC tag detected");

      // STEP 2: NDEF 메시지 생성 및 인코딩
      console.log("[NFC] STEP 2: Creating NDEF message...");
      const bytes = Ndef.encodeMessage([Ndef.textRecord("Hello NFC")]);
      console.log(
        "[NFC] STEP 2: Message encoded:",
        bytes ? "success" : "failed"
      );

      if (bytes) {
        // STEP 3: NFC 태그에 쓰기
        console.log("[NFC] STEP 3: Writing to NFC tag...");
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        console.log("[NFC] STEP 3: Write successful");
        result = true;
      }
    } catch (ex) {
      console.warn("[NFC] Error:", ex);
    } finally {
      // STEP 4: NFC 세션 종료
      console.log("[NFC] STEP 4: Cleaning up NFC session...");
      NfcManager.cancelTechnologyRequest();
      console.log("[NFC] STEP 4: Cleanup complete");
    }

    return result;
  }
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
          <TouchableOpacity onPress={readNdef}>
            <Text>Scan a Tag</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => writeNdef({ type: "text", value: "Hello NFC" })}
          >
            <Text>Write a Tag2</Text>
          </TouchableOpacity>
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
                onPress={() => sendData("Hello from HDCX Wallet!")}
              >
                <Text style={{ color: "white" }}>Send Test Message</Text>
              </Button>
            )}
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
});
