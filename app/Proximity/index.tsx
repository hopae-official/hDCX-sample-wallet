import { Button } from "@/components/ui/button";
import { Colors } from "@/constants/Colors";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View, StyleSheet } from "react-native";

export default function ProximityScreen() {
  const { requestUri } = useLocalSearchParams<{ requestUri: string }>();

  const handleClickNetwork = () => {
    router.push({
      pathname: "/Verify/CredentialPresentation",
      params: { requestUri },
    });
  };

  const handleClickBLE = () => {
    router.push({
      pathname: "/Proximity/CredentialPresentation",
      params: { requestUri },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Presentation Channel</Text>
      <Button
        style={styles.networkButton}
        variant="default"
        onPress={handleClickNetwork}
      >
        <Text style={{ color: "white" }}>via Network</Text>
      </Button>
      <Button
        style={styles.bleButton}
        variant="default"
        onPress={handleClickBLE}
      >
        <Text style={{ color: "white" }}>via Bluetooth</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    gap: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  networkButton: {
    backgroundColor: Colors.light.orange,
  },
  bleButton: {
    backgroundColor: Colors.light.lightBlue,
  },
});
