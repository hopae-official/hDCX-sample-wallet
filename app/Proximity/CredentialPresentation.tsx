import { router, Stack } from "expo-router";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/button";
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { Colors } from "@/constants/Colors";
import { CredentialCard } from "@/components/CredentialCard";
import { ProviderInfo } from "@/components/ProviderInfo";
import { useCredentialCarousel } from "@/hooks/useCredentialCarousel";
import { ClaimSelector } from "@/components/ClaimSelector";
import { useClaimSelector } from "@/hooks/useClaimSelector";
import { Device, BleManager } from "react-native-ble-plx";
import logger from "@/utils/logger";
import base64 from "react-native-base64";
import { RequestObject } from "@/types";
import { useWallet } from "@/contexts/WalletContext";

const bleManager = new BleManager();
const SERVICE_UUID = "4FAFC201-1FB5-459E-8FCC-C5C9C331914B";
const CHARACTERISTIC_UUID = "BEB5483E-36E1-4688-B7F5-EA07361B26A8";
const DEVICE_NAME = "HDCXWallet";

export default function ProximityCredentialPresentationScreen() {
  const walletSDK = useWallet();
  const {
    credentials,
    setCredentials,
    selectedCredential,
    carouselRef,
    progress,
    setCurrentIndex,
    onPressPagination,
  } = useCredentialCarousel();

  const { selectedOptions, toggleOption } = useClaimSelector(
    selectedCredential,
    REQUIRED_CLAIMS
  );

  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const [subscription, setSubscription] = useState<any>(null);
  const [requestObject, setRequestObject] = useState<RequestObject | null>(
    null
  );

  useEffect(() => {
    (async function loadCredentials() {
      const storedCredentials = await walletSDK.selectCredentials();
      setCredentials(storedCredentials ? JSON.parse(storedCredentials) : []);
    })();
  }, []);

  const handlePressPresent = async () => {
    if (!selectedCredential || !requestObject) return;

    const vpToken = await walletSDK.generateVPToken(
      selectedCredential.raw,
      PRESENTATION_FRAME,
      requestObject
    );

    sendDataViaBLE(
      JSON.stringify({
        type: "vp_token",
        value: JSON.stringify({ 0: vpToken }),
      })
    );
  };

  const handlePressDeny = () => {
    router.dismissAll();
    router.push({ pathname: "/" });
  };

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
      console.log("startScanning");
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
              setIsScanning(false);
            }
          }
        );

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
    if (connectedDevice && subscription) {
      logger.log("connectedDevice", connectedDevice);
      sendDataViaBLE(JSON.stringify({ type: "ack" }));
    }
  }, [connectedDevice, subscription]);

  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.remove();
        setSubscription(null);
        logger.log("Characteristic monitoring subscription cleaned up");
      }
    };
  }, [subscription]);

  useEffect(() => {
    if (!connectedDevice && subscription) {
      subscription.remove();
      setSubscription(null);
      logger.log(
        "Characteristic monitoring subscription removed due to device disconnection"
      );
    }
  }, [connectedDevice, subscription]);

  const connectToDevice = async (device: Device) => {
    try {
      console.log("Connecting to device:", device.name);
      const connectedDevice = await device.connect();

      setConnectedDevice(connectedDevice);

      console.log("Discovering services and characteristics");
      const discoveredDevice =
        await connectedDevice.discoverAllServicesAndCharacteristics();

      // 모니터링 설정
      setupCharacteristicMonitoring(discoveredDevice);

      console.log(" Connected to device");
    } catch (error) {
      console.error(" Connection error:", error);
      Alert.alert("Error", "Failed to connect to device");
    }
  };

  const setupCharacteristicMonitoring = async (discoveredDevice: Device) => {
    console.log(" Setting up characteristic monitoring");

    const chunkStore: { [key: string]: string[] } = {};

    try {
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
              const cleanValue = characteristic.value.replace(/\s/g, "");
              const decodedValue = base64.decode(cleanValue);
              console.log(" Received notification from peripheral:");
              console.log(" - Base64 encoded:", cleanValue);
              console.log(" - Decoded data:", decodedValue);

              // Parse chunk information
              const [indexStr, totalStr, chunkData] = decodedValue.split(":");
              const chunkIndex = parseInt(indexStr, 10);
              const totalChunks = parseInt(totalStr, 10);

              console.log(`Received chunk ${chunkIndex + 1}/${totalChunks}`);

              // Create message key based on total chunks
              const messageKey = `message_${totalChunks}`;

              // Initialize chunk array if not exists
              if (!chunkStore[messageKey]) {
                chunkStore[messageKey] = new Array(totalChunks).fill("");
              }
              chunkStore[messageKey][chunkIndex] = chunkData;

              console.log("Current chunks:", chunkStore[messageKey]);

              // Check if all chunks are received
              if (chunkStore[messageKey]?.every((chunk) => chunk !== "")) {
                // Combine all chunks
                const completeData = chunkStore[messageKey].join("");

                try {
                  const decoded = base64.decode(completeData);

                  // Check if it's JSON data
                  if (
                    decoded.trim().startsWith("{") ||
                    decoded.trim().startsWith("[")
                  ) {
                    const jsonData = JSON.parse(decoded);

                    if (jsonData.type === "request_object") {
                      setRequestObject(jsonData.value);
                    }

                    if (jsonData.type === "presentation_result") {
                      router.replace("/Verify/VerifyResult");
                    }
                  }
                } catch (parseError) {
                  console.error("Error parsing complete data:", parseError);
                }

                // Clear the chunks after processing
                delete chunkStore[messageKey];
              }
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

  const sendDataViaBLE = async (data: string) => {
    if (!connectedDevice) {
      console.error(" No connected device");
      Alert.alert("Error", "No device connected. Please connect first.");
      return;
    }

    try {
      const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(data);
      const encodedData = isBase64 ? data : base64.encode(data);

      // Split data into chunks (100 characters per chunk)
      const chunkSize = 300;
      const chunks =
        encodedData.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [];
      console.log(` Splitting data into ${chunks.length} chunks`);

      // Send chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const isLastChunk = i === chunks.length - 1;

        // Add chunk metadata and encode the whole thing
        const chunkWithMetadata = `${i}:${chunks.length}:${chunk}`;
        const encodedChunk = base64.encode(chunkWithMetadata);

        console.log(
          ` Sending chunk ${i + 1}/${chunks.length}, length: ${
            encodedChunk.length
          }`
        );

        try {
          await connectedDevice.writeCharacteristicWithoutResponseForService(
            SERVICE_UUID,
            CHARACTERISTIC_UUID,
            encodedChunk
          );
          console.log(` Chunk ${i + 1} sent successfully`);

          // Add small delay between chunks to prevent data loss
          if (!isLastChunk) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (writeError) {
          console.error(` Failed to send chunk ${i + 1}:`, writeError);
          throw writeError;
        }
      }

      console.log(" All chunks sent successfully");
    } catch (error) {
      console.error(" Failed to send data:", error);
      Alert.alert(
        "Send Error",
        "Failed to send data to device. Please try reconnecting."
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={27} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollViewContent}
        bounces={false}
      >
        <Text style={styles.title}>
          An organization is asking for information
        </Text>

        <View style={styles.carouselContainer}>
          <Carousel
            ref={carouselRef}
            style={styles.carousel}
            width={310}
            height={300}
            data={credentials ?? []}
            loop={false}
            onProgressChange={progress}
            onScrollEnd={setCurrentIndex}
            snapEnabled={true}
            renderItem={({ item }) => <CredentialCard issuer={item.iss} />}
          />
          <Pagination.Basic
            progress={progress}
            data={credentials ?? []}
            dotStyle={{
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: 50,
            }}
            containerStyle={{ gap: 5, marginTop: 10 }}
            onPress={onPressPagination}
          />
        </View>

        <ProviderInfo issuer={selectedCredential?.iss ?? ""} />

        <View style={styles.dataInfoContainer}>
          <ClaimSelector
            credential={selectedCredential}
            selectedOptions={selectedOptions}
            onToggleOption={toggleOption}
            requiredClaims={REQUIRED_CLAIMS}
          />
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            variant="default"
            style={styles.acceptButton}
            onPress={handlePressPresent}
          >
            <Text style={styles.acceptButtonText}>Present</Text>
          </Button>
          <Button
            variant="default"
            style={styles.denyButton}
            onPress={handlePressDeny}
          >
            <Text>Cancel</Text>
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingTop: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
    alignSelf: "flex-start",
    marginStart: 20,
  },
  carouselContainer: {
    width: "100%",
  },
  carousel: {
    width: "100%",
    height: 220,
    justifyContent: "center",
  },
  dataInfoContainer: {
    width: "100%",
    alignItems: "center",
    flex: 1,
  },
  buttonWrapper: {
    marginVertical: 30,
    width: "90%",
    gap: 5,
  },
  acceptButton: {
    backgroundColor: Colors.light.orange,
  },
  acceptButtonText: {
    color: "white",
  },
  denyButton: {
    borderWidth: 1,
    borderColor: "gray",
    backgroundColor: "white",
  },
});

const REQUIRED_CLAIMS = ["iss", "vct"] as const;
const PRESENTATION_FRAME = {
  family_name: true,
  given_name: true,
  birth_date: true,
  age_over_18: true,
  issuance_date: true,
  expiry_date: true,
  issuing_country: true,
  issuing_authority: true,
} as const;
