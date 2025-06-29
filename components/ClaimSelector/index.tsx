import { Card } from "@/components/ui/card";
import { View, StyleSheet } from "react-native";
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
    <View style={styles.dataInfoCard}>
      <Card style={styles.infoWrapper}>
        {Object.entries(credential)
          .filter(([key, value]) => isValidClaimValue(value) && key !== "raw")
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
    </View>
  );
}

const styles = StyleSheet.create({
  dataInfoCard: {
    marginTop: 10,
    width: "100%",
    alignItems: "center",
    padding: 10,
  },
  infoWrapper: {
    padding: 10,
    borderRadius: 5,
    width: "100%",
    gap: 10,
    backgroundColor: Colors.light.background,
    borderColor: "transparent",
  },
});
