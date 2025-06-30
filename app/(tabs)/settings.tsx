import { StyleSheet, View, Text, Alert, Switch } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/Colors";
import { Button } from "@/components/ui/button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CREDENTIALS_STORAGE_KEY } from "@/types";
import { useWallet } from "@/contexts/WalletContext";
import { router } from "expo-router";

export const RASPBERRY_PI_DEMO_KEY = "RASPBERRY_PI_DEMO_ENABLED";

export default function SettingsScreen() {
  const walletSDK = useWallet();
  const router = useRouter();
  const [isRaspberryPiDemo, setIsRaspberryPiDemo] = useState(false);

  useEffect(() => {
    // Load Raspberry Pi demo mode state
    AsyncStorage.getItem(RASPBERRY_PI_DEMO_KEY).then((value) => {
      setIsRaspberryPiDemo(value === "true");
    });
  }, []);

  const handleToggleRaspberryPiDemo = async () => {
    const newValue = !isRaspberryPiDemo;
    await AsyncStorage.setItem(RASPBERRY_PI_DEMO_KEY, String(newValue));
    setIsRaspberryPiDemo(newValue);
  };

  const handlePressReset = () => {
    Alert.alert(
      "Reset credentials",
      "Are you sure you want to reset your credentials?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
        },
        {
          text: "Confirm",
          onPress: () => {
            AsyncStorage.removeItem(CREDENTIALS_STORAGE_KEY);
            walletSDK.credentialStore.clear();
          },
        },
      ]
    );
  };

  return (
    <>
      <View style={styles.container}>
        <Button
          variant={"default"}
          onPress={handlePressReset}
          style={{ backgroundColor: Colors.light.orange }}
        >
          <Text style={{ color: "white" }}>Reset credentials</Text>
        </Button>
        <Button
          variant={"default"}
          onPress={() => router.push("/SampleVerifier")}
          style={{ backgroundColor: Colors.light.lightBlue }}
        >
          <Text style={{ color: "white" }}>Sample Verifier</Text>
        </Button>
        <View style={styles.settingItem}>
          <Text>Raspberry Pi Demo</Text>
          <Switch
            value={isRaspberryPiDemo}
            onValueChange={handleToggleRaspberryPiDemo}
            trackColor={{ false: "gray", true: "green" }}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
    paddingTop: 20,
    gap: 40,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: 10,
  },
  divider: {
    height: 1,
    width: "90%",
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
});
