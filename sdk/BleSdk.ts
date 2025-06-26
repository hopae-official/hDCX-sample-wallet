import { Device, Characteristic } from "react-native-ble-plx";
import base64 from "react-native-base64";
import { Alert } from "react-native";
import logger from "@/utils/logger";

export type BleCallback = (error: Error | null, data: string | null) => void;

export class BleSdk {
  private static instance: BleSdk;
  private readonly SERVICE_UUID = "4FAFC201-1FB5-459E-8FCC-C5C9C331914B";
  private readonly CHARACTERISTIC_UUID = "BEB5483E-36E1-4688-B7F5-EA07361B26A8";
  private readonly CHUNK_SIZE = 300;
  private chunkStore: { [key: string]: string[] } = {};

  private constructor() {}

  public static getInstance(): BleSdk {
    if (!BleSdk.instance) {
      BleSdk.instance = new BleSdk();
    }
    return BleSdk.instance;
  }

  public monitorCharacteristic(device: Device, callback: BleCallback) {
    logger.log("Setting up characteristic monitoring");

    try {
      const subscription = device.monitorCharacteristicForService(
        this.SERVICE_UUID,
        this.CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            callback(error, null);
            return;
          }

          if (!characteristic?.value) {
            logger.log("No value in characteristic update");
            callback(null, null);
            return;
          }

          try {
            const cleanValue = characteristic.value.replace(/\s/g, "");
            const decodedValue = base64.decode(cleanValue);

            // Parse chunk information
            const [indexStr, totalStr, chunkData] = decodedValue.split(":");
            const chunkIndex = parseInt(indexStr, 10);
            const totalChunks = parseInt(totalStr, 10);
            const messageKey = `message_${totalChunks}`;

            // Initialize chunk array if not exists
            if (!this.chunkStore[messageKey]) {
              this.chunkStore[messageKey] = new Array(totalChunks).fill("");
            }
            this.chunkStore[messageKey][chunkIndex] = chunkData;

            // Check if all chunks are received
            if (this.chunkStore[messageKey]?.every((chunk) => chunk !== "")) {
              const completeData = this.chunkStore[messageKey].join("");
              const decoded = base64.decode(completeData);
              callback(null, decoded);
              delete this.chunkStore[messageKey];
            }
          } catch (error) {
            const typedError =
              error instanceof Error ? error : new Error(String(error));
            logger.error("Error processing data:", error);
            callback(typedError, null);
          }
        }
      );

      logger.log("Characteristic monitoring subscription created");
      return subscription;
    } catch (error) {
      const typedError =
        error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to setup characteristic monitoring:", error);
      throw typedError;
    }
  }

  public async sendData(device: Device, data: string): Promise<void> {
    if (!device) {
      logger.error("No connected device");
      Alert.alert("Error", "No device connected. Please connect first.");
      return;
    }

    try {
      const chunks = this.prepareDataChunks(data);
      await this.sendChunks(device, chunks);
    } catch (error) {
      logger.error("Failed to send data:", error);
      Alert.alert(
        "Send Error",
        "Failed to send data to device. Please try reconnecting."
      );
    }
  }

  private prepareDataChunks(data: string): string[] {
    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(data);
    const encodedData = isBase64 ? data : base64.encode(data);
    return encodedData.match(new RegExp(`.{1,${this.CHUNK_SIZE}}`, "g")) || [];
  }

  private async sendChunks(device: Device, chunks: string[]): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLastChunk = i === chunks.length - 1;
      const chunkWithMetadata = `${i}:${chunks.length}:${chunk}`;
      const encodedChunk = base64.encode(chunkWithMetadata);

      try {
        await device.writeCharacteristicWithoutResponseForService(
          this.SERVICE_UUID,
          this.CHARACTERISTIC_UUID,
          encodedChunk
        );

        if (!isLastChunk) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (writeError) {
        logger.error(`Failed to send chunk ${i + 1}:`, writeError);
        throw writeError;
      }
    }
  }
}
