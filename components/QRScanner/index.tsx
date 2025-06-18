import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { CameraView } from "expo-camera";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const SCAN_AREA_SIZE = { width: 250, height: 250 };

type QRScannerProps = {
  onBarcodeScanned: (event: {
    data: string;
    type: string;
    bounds: { origin: { x: number; y: number } };
  }) => void;
  isLoading?: boolean;
};

export const QRScanner = ({ onBarcodeScanned, isLoading }: QRScannerProps) => {
  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={onBarcodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {isLoading && (
        <ActivityIndicator
          color={"white"}
          size="large"
          style={{ position: "absolute" }}
        />
      )}
      <View style={styles.overlay}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close-outline" size={30} color="white" />
        </TouchableOpacity>
        <View style={styles.overlaySection} />
        <View style={styles.centerRow}>
          <View style={styles.overlaySection} />
          <View style={styles.scanArea} />
          <View style={styles.overlaySection} />
        </View>
        <View style={styles.overlayTextSection}>
          <Text style={styles.overlayText}>Scan a QR code</Text>
        </View>
        <View style={styles.overlaySection} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlaySection: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  closeButton: {
    marginTop: 50,
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 1,
    padding: 18,
  },
  overlayTextSection: {
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
    color: "white",
  },
  overlayText: {
    color: "white",
  },
  scanArea: {
    width: SCAN_AREA_SIZE.width,
    height: SCAN_AREA_SIZE.height,
    backgroundColor: "transparent",
    position: "relative",
    overflow: "hidden",
    borderColor: "white",
    borderWidth: 1,
  },
  centerRow: {
    flexDirection: "row",
    height: SCAN_AREA_SIZE.height,
  },
});
