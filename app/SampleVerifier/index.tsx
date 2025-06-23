import { Button } from "@/components/ui/button";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
} from "react-native";

import Peripheral, { Characteristic, Service } from "react-native-peripheral";
import base64 from "react-native-base64";
import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";
import { writeNdef } from "@/utils/nfc";
import logger from "@/utils/logger";

const SERVICE_UUID = "4FAFC201-1FB5-459E-8FCC-C5C9C331914B";
const CHARACTERISTIC_UUID = "BEB5483E-36E1-4688-B7F5-EA07361B26A8";
const DEVICE_NAME = "HDCXWallet";

export default function SampleVerifierScreen() {
  const params = useLocalSearchParams<{ requestUri: string }>();
  const [step, setStep] = useState(0);
  const [peripheralChar, setPeripheralChar] = useState<Characteristic | null>(
    null
  );
  const [bleState, setBleState] = useState<
    "initial" | "advertising" | "connected" | "disconnected"
  >("initial");
  const [requestUri, setRequestUri] = useState(params.requestUri);

  const setupPeripheral = useCallback(async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]);
    }

    Peripheral.onStateChanged(async (state) => {
      if (state === "poweredOn") {
        try {
          await Peripheral.removeAllServices();

          const char = new Characteristic({
            uuid: CHARACTERISTIC_UUID,
            value: base64.encode("initial"),
            permissions: ["readable", "writeable"],
            properties: [
              "read",
              "write",
              "writeWithoutResponse",
              "notify",
              "indicate",
            ],
            onWriteRequest: async (value) => {
              const decodedValue = base64.decode(value);
              const parsedValue = JSON.parse(decodedValue);
              console.log(
                " Write request received from Central:",
                decodedValue
              );

              if (parsedValue?.type === "data") {
                logger.log("Received data:", parsedValue.value);
              }

              if (parsedValue?.type === "ack") {
                logger.log("Bluetooth connection established");
                //setStep(2);
              }
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

          setBleState("advertising");
          setPeripheralChar(char);
        } catch (error) {
          console.error(" Failed to setup peripheral:****", error);
          setBleState("disconnected");
        }
      }
    });
  }, []);

  useEffect(() => {
    if (step < 1) return;
    if (bleState === "initial" || bleState === "disconnected")
      setupPeripheral();
  }, [setupPeripheral, bleState, step]);

  useEffect(() => {
    return () => {
      Peripheral.removeAllServices();
      Peripheral.stopAdvertising();
      setBleState("disconnected");
    };
  }, []);

  const sendDataFromPeripheral = async (data: string) => {
    try {
      console.log("Starting sendDataFromPeripheral with data:", data);

      if (!peripheralChar) {
        console.error(" No peripheral characterstic found");
        return;
      }

      const encodedData = base64.encode(data);
      await peripheralChar.notify(encodedData);
    } catch (error) {
      console.error(" Error in sendDataFromPeripheral:", error);
    }
  };

  const handlePressQRScanButton = () => {
    router.replace("/SampleVerifier/QR");
  };

  const handleWriteNFCTag = async () => {
    if (!requestUri) return;

    try {
      const result = await writeNdef(requestUri);

      if (!result) {
        Alert.alert("Failed to write NFC tag");
      } else {
        setStep(1);
      }
    } catch (e) {
      logger.error("Error writing NFC tag:", e);
    }
  };

  const refreshVerifier = () => {
    setStep(0);
    setRequestUri("");
  };
  return (
    <>
      <Stack.Screen
        options={{
          title: "Sample Verifier",
          headerStyle: {
            backgroundColor: Colors.light.lightBlue,
          },

          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={27} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {step === 0 && (
          <>
            {requestUri ? (
              <>
                <Text style={styles.title}>
                  Scan NFC Tag To Connect Bluetooth
                </Text>
                <Text style={styles.requestUriText}>{requestUri}</Text>
                <Button
                  variant={"default"}
                  style={{ backgroundColor: Colors.light.lightBlue }}
                  onPress={handleWriteNFCTag}
                >
                  <Text style={{ color: "white" }}>Write NFC Tag</Text>
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.title}>Set Up Verifier via QR scan</Text>
                <Button
                  variant={"default"}
                  style={{ backgroundColor: Colors.light.lightBlue }}
                  onPress={handlePressQRScanButton}
                >
                  <Text style={{ color: "white" }}>Prepare Verifier</Text>
                </Button>
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.title}>Waiting Bluetooth Connection...</Text>
            <ActivityIndicator color={Colors.light.lightBlue} size="large" />
          </>
        )}

        <TouchableOpacity style={styles.qrScanButton} onPress={refreshVerifier}>
          <Ionicons size={25} name="refresh" color={"white"} />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  requestUriText: {
    backgroundColor: "lightgray",
    padding: 20,
    borderRadius: 10,
    margin: 20,
  },
  qrScanButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "black",
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
