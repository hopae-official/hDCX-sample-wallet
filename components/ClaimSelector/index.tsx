import { View, StyleSheet, Text } from "react-native";
import { InfoItem } from "@/components/InfoItem";
import { Colors } from "@/constants/Colors";

type ClaimSelectorProps = {
  credential: Record<string, unknown> | null;
  selectedOptions: Record<string, boolean>;
  onToggleOption: (key: string) => void;
  requiredClaims: readonly string[];
};

const isValidValue = (value: unknown): value is string | number => {
  if (typeof value === "string" && value.startsWith("data:image")) return false;
  return true;
};

const NestedClaim = ({
  label,
  value,
  path,
  indent = 0,
  requiredClaims,
  selectedOptions,
  onToggleOption,
  showCheckbox = true,
}: {
  label: string;
  value: unknown;
  path: string;
  indent?: number;
  requiredClaims: readonly string[];
  selectedOptions: Record<string, boolean>;
  onToggleOption: (key: string) => void;
  showCheckbox?: boolean;
}) => {
  if (typeof value === "string" && value.startsWith("data:image")) {
    return null;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return (
      <View style={[styles.nestedContainer, { marginLeft: indent * 20 }]}>
        <Text style={styles.nestedLabel}>{label}</Text>
        {Object.entries(value as Record<string, unknown>).map(([key, val]) => {
          const fullPath = path ? `${path}.${key}` : key;
          return (
            <NestedClaim
              key={fullPath}
              label={key}
              value={val}
              path={fullPath}
              indent={indent + 1}
              requiredClaims={requiredClaims}
              selectedOptions={selectedOptions}
              onToggleOption={onToggleOption}
              showCheckbox={showCheckbox}
            />
          );
        })}
      </View>
    );
  }

  if (Array.isArray(value) || isValidValue(value)) {
    const isRequired = requiredClaims.includes(path);
    return (
      <InfoItem
        label={label}
        value={Array.isArray(value) ? value.join(", ") : value}
        isRequired={isRequired}
        isSelected={!!selectedOptions[path]}
        onToggle={() => onToggleOption(path)}
        showCheckbox={showCheckbox}
      />
    );
  }

  return null;
};

const ClaimGroup = ({
  title,
  claims,
  selectedOptions,
  onToggleOption,
  requiredClaims,
  showCheckbox = true,
}: {
  title: string;
  claims: [string, unknown][];
  selectedOptions: Record<string, boolean>;
  onToggleOption: (key: string) => void;
  requiredClaims: readonly string[];
  showCheckbox?: boolean;
}) => {
  if (claims.length === 0) return null;

  return (
    <View style={styles.claimGroup}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.claimList}>
        {claims.map(([key, value]) => (
          <NestedClaim
            key={key}
            label={key}
            value={value}
            path={key}
            requiredClaims={requiredClaims}
            selectedOptions={selectedOptions}
            onToggleOption={onToggleOption}
            showCheckbox={showCheckbox}
          />
        ))}
      </View>
    </View>
  );
};

export function ClaimSelector({
  credential,
  selectedOptions,
  onToggleOption,
  requiredClaims,
}: ClaimSelectorProps) {
  if (!credential) return null;

  const allClaims = Object.entries(credential).filter(
    ([key]) => key !== "raw" && key !== "cnf"
  );
  const requiredClaimEntries = allClaims.filter(([key]) =>
    requiredClaims.some((path) => path.startsWith(key))
  );
  const optionalClaimEntries = allClaims.filter(
    ([key]) => !requiredClaims.some((path) => path.startsWith(key))
  );

  return (
    <View style={styles.dataInfoCard}>
      <ClaimGroup
        title="Required Claims"
        claims={requiredClaimEntries}
        selectedOptions={selectedOptions}
        onToggleOption={onToggleOption}
        requiredClaims={requiredClaims}
        showCheckbox={false}
      />
      <ClaimGroup
        title="Optional Claims"
        claims={optionalClaimEntries}
        selectedOptions={selectedOptions}
        onToggleOption={onToggleOption}
        requiredClaims={requiredClaims}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dataInfoCard: {
    width: "100%",
    paddingHorizontal: 20,
  },
  claimGroup: {
    marginBottom: 20,
    backgroundColor: "#faf8e3",
    padding: 10,
    borderRadius: 10,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  claimList: {
    gap: 8,
  },
  nestedContainer: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.border,
    paddingLeft: 10,
    marginBottom: 8,
  },
  nestedLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 8,
  },
});
