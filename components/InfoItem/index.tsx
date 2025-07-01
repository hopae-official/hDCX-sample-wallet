import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { toPascalCase } from "@/utils/string";
import { Ionicons } from "@expo/vector-icons";

type InfoItemProps = {
  label: string;
  value: unknown;
  isRequired?: boolean;
  isSelected?: boolean;
  onToggle?: () => void;
  showCheckbox?: boolean;
};

export function InfoItem({
  label,
  value,
  isRequired,
  isSelected,
  onToggle,
  showCheckbox = true,
}: InfoItemProps) {
  const content = (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{toPascalCase(label)}</Text>
        {isRequired && <Text style={styles.requiredBadge}>Required</Text>}
      </View>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );

  if (!showCheckbox) {
    return content;
  }

  return (
    <TouchableOpacity onPress={onToggle} disabled={isRequired}>
      <View style={styles.row}>
        <TouchableOpacity onPress={onToggle} disabled={isRequired}>
          <Ionicons
            name="checkbox-outline"
            size={20}
            color={isRequired ? "black" : isSelected ? "green" : "lightgray"}
          />
        </TouchableOpacity>
        {content}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  container: {
    flex: 1,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "gray",
  },
  value: {
    fontSize: 14,
    color: Colors.light.text,
  },
  requiredBadge: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: "500",
  },
});
