import { Button } from "@/components/ui/button";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState, useRef } from "react";
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
import { writeNdef } from "@/utils/nfc";
import logger from "@/utils/logger";
import { useWallet } from "@/contexts/WalletContext";
import { RequestObject } from "@/types";
import { Oid4VpClient } from "@vdcs/oid4vp-client";
import LottieView from "lottie-react-native";

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

  const chunkStore: { [key: string]: string[] } = {};
  const walletSDK = useWallet();
  const requestObject = useRef<RequestObject | null>(null);

  const CHUNK_SIZE = 300; // Adjust this size based on your needs

  const sendChunkedData = async (char: Characteristic, data: string) => {
    const encodedData = base64.encode(data);
    const totalChunks = Math.ceil(encodedData.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = encodedData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkMessage = `${i}:${totalChunks}:${chunk}`;
      await char.notify(base64.encode(chunkMessage));

      // Add a small delay between chunks to ensure reliable transmission
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

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
              try {
                console.log("value ** ", value);
                const cleanValue = value.replace(/\s/g, "");
                const decodedValue = base64.decode(cleanValue);
                console.log("decodedValue ** ", decodedValue);

                // Parse chunk metadata (format: index:total:data)
                const [indexStr, totalStr, chunkData] = decodedValue.split(":");
                const chunkIndex = parseInt(indexStr, 10);
                const totalChunks = parseInt(totalStr, 10);

                console.log(`Received chunk ${chunkIndex + 1}/${totalChunks}`);

                // Create or update chunk array for this message
                const messageKey = `${CHARACTERISTIC_UUID}_${totalChunks}`;
                if (!chunkStore[messageKey]) {
                  chunkStore[messageKey] = new Array(totalChunks).fill("");
                }

                // Store this chunk
                chunkStore[messageKey][chunkIndex] = chunkData;

                // Check if we have all chunks
                const isComplete = chunkStore[messageKey].every(
                  (chunk) => chunk !== ""
                );

                if (isComplete) {
                  // Combine all chunks
                  const completeData = chunkStore[messageKey].join("");
                  console.log("Received complete data:", completeData);

                  try {
                    // Parse the complete data
                    const decoded = base64.decode(completeData);
                    console.log("Decoded complete data:", decoded);

                    if (
                      decoded.trim().startsWith("{") ||
                      decoded.trim().startsWith("[")
                    ) {
                      const jsonData = JSON.parse(decoded);
                      console.log("Parsed JSON data:", jsonData);

                      if (jsonData.type === "ack") {
                        // Connection established

                        setStep(2);

                        const reqObject = await walletSDK.load(requestUri);
                        requestObject.current = reqObject;

                        // Send request object in chunks
                        await sendChunkedData(
                          char,
                          JSON.stringify({
                            type: "request_object",
                            value: reqObject,
                          })
                        );
                      }

                      if (jsonData.type === "vp_token") {
                        logger.log("Presentation received:", jsonData);

                        if (!requestObject.current) {
                          logger.error("Request object is undefined");
                          return;
                        }

                        const client = new Oid4VpClient(requestObject.current);
                        console.log("jsonData.value", jsonData.value);
                        const result = await client.sendPresentation(
                          JSON.parse(jsonData.value)
                        );

                        if (!result) {
                          logger.error("Presentation failed");
                        }

                        await sendChunkedData(
                          char,
                          JSON.stringify({
                            type: "presentation_result",
                            value: result,
                          })
                        );

                        setStep(3)
                      }
                    }
                  } catch (parseError) {
                    console.error("Error parsing complete data:", parseError);
                  }

                  // Clear the stored chunks
                  delete chunkStore[messageKey];
                }
              } catch (error) {
                logger.error("Failed to handle write request", error);
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

        {step === 2 && (
          <>
            <Text style={styles.title}>Bluetooth Connected</Text>
            <Text style={styles.description}>Waiting Presentation...</Text>
            <ActivityIndicator color={Colors.light.lightBlue} size="large" />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.title}>Verify Success</Text>
            <LottieView
              speed={0.8}
              style={{
                width: 64,
                height: 64,
              }}
              autoPlay={true}
              loop={false}
              source={require("@/assets/lotties/check.json")}
            />
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
  description: {
    fontSize: 18,
    marginBottom: 20,
  },
});
