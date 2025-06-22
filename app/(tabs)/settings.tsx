import { StyleSheet, View, Text, Alert, Switch } from "react-native";

import { Colors } from "@/constants/Colors";
import { Button } from "@/components/ui/button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CREDENTIALS_STORAGE_KEY } from "@/types";
import { useWallet } from "@/contexts/WalletContext";
import { useState, useEffect } from "react";

const VERIFIER_MODE_KEY = "verifier_mode";

export default function SettingsScreen() {
  const walletSDK = useWallet();
  const [isVerifierMode, setIsVerifierMode] = useState(false);

  useEffect(() => {
    // Load verifier mode setting on component mount
    loadVerifierMode();
  }, []);

  const loadVerifierMode = async () => {
    try {
      const value = await AsyncStorage.getItem(VERIFIER_MODE_KEY);
      setIsVerifierMode(value === "true");
    } catch (error) {
      console.error("Error loading verifier mode:", error);
    }
  };

  const toggleVerifierMode = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(VERIFIER_MODE_KEY, value.toString());
      setIsVerifierMode(value);
    } catch (error) {
      console.error("Error saving verifier mode:", error);
      Alert.alert("Error", "Failed to save verifier mode setting");
    }
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
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Verifier Mode</Text>
          <Switch
            trackColor={{ false: "#767577", true: Colors.light.orange }}
            thumbColor={isVerifierMode ? "#fff" : "#f4f3f4"}
            onValueChange={toggleVerifierMode}
            value={isVerifierMode}
          />
        </View>
        <View style={styles.divider} />
        <Button
          variant={"default"}
          onPress={handlePressReset}
          style={{ backgroundColor: Colors.light.orange }}
        >
          <Text style={{ color: "white" }}>Reset credentials</Text>
        </Button>
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
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    paddingVertical: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    width: "90%",
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
});
