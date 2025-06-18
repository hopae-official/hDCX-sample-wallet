import { Card } from "@/components/ui/card";
import { View, Text, StyleSheet } from "react-native";
import { CircleIcon } from "@/components/CircleIcon";
import { InfoItem } from "@/components/InfoItem";
import { StoredCredential } from "@/types";
import { ClaimSelectorOptions } from "@/hooks/useClaimSelector";
import { Colors } from "@/constants/Colors";

type ClaimSelectorProps = {
  credential: StoredCredential | null;
  selectedOptions: ClaimSelectorOptions;
  onToggleOption: (key: string) => void;
  requiredClaims: readonly string[];
};

export function ClaimSelector({
  credential,
  selectedOptions,
  onToggleOption,
  requiredClaims,
}: ClaimSelectorProps) {
  if (!credential) return null;

  const isValidClaimValue = (value: unknown): value is string | number => {
    if (typeof value !== "string" && typeof value !== "number") return false;
    if (typeof value === "string" && value.startsWith("data:image"))
      return false;
    return true;
  };

  return (
    <Card style={styles.dataInfoCard}>
      <View style={styles.cardHeader}>
        <CircleIcon name="newspaper" />
        <Text style={styles.title}>Information</Text>
      </View>

      <Card style={styles.infoWrapper}>
        {Object.entries(credential)
          .filter(([key, value]) => key !== "raw" && isValidClaimValue(value))
          .map(([key, value]) => (
            <InfoItem
              key={key}
              label={key}
              value={value as string | number}
              isRequired={requiredClaims.includes(key)}
              isSelected={!!selectedOptions[key]}
              onToggle={() => onToggleOption(key)}
            />
          ))}
      </Card>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000",
  },
  dataInfoCard: {
    marginTop: 10,
    width: "90%",
    alignItems: "center",
    padding: 15,
    backgroundColor: Colors.light.lightYellow,
    borderColor: "transparent",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  infoWrapper: {
    padding: 10,
    borderRadius: 5,
    width: "100%",
    gap: 20,
    backgroundColor: Colors.light.background,
    borderColor: "transparent",
  },
});
