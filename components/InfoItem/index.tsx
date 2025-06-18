import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type InfoItemProps = {
  label: string;
  value: string | number;
  isRequired: boolean;
  isSelected: boolean;
  onToggle: () => void;
};

export const InfoItem = ({
  label,
  value,
  isRequired,
  isSelected,
  onToggle,
}: InfoItemProps) => (
  <View style={styles.optionWrapper}>
    <TouchableOpacity onPress={onToggle} disabled={isRequired}>
      <Ionicons
        name="checkbox-outline"
        size={20}
        color={isRequired ? "black" : isSelected ? "green" : "lightgray"}
      />
    </TouchableOpacity>
    <View>
      <Text style={styles.infoLabelText}>
        {label.replace(/_/g, " ").toUpperCase()}
        {isRequired && " (required)"}
      </Text>
      <Text style={styles.infoText}>{value.toString()}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  optionWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabelText: {
    fontSize: 15,
    opacity: 0.5,
    color: "#000",
  },
  infoText: {
    fontSize: 15,
    opacity: 0.7,
    color: "#000",
  },
});
