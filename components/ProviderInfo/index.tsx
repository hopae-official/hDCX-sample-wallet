import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { Ionicons } from "@expo/vector-icons";

import { CircleIcon } from "../CircleIcon";
import { Colors } from "@/constants/Colors";

type ProviderInfoProps = {
  issuer: string;
};

export const ProviderInfo = ({ issuer }: ProviderInfoProps) => (
  <Card style={styles.providerCard}>
    <CircleIcon name="newspaper" />
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
      <Text style={styles.boldText}>{issuer}</Text>
      <Ionicons
        name="checkmark-circle-outline"
        size={20}
        color="green"
        opacity={0.5}
      />
    </View>
    <Ionicons name="chevron-down" size={24} />
  </Card>
);

const styles = StyleSheet.create({
  boldText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  providerCard: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 20,
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.border,
  },
});
