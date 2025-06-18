import { StyleSheet, Text, View, Image } from "react-native";
import { Colors } from "@/constants/Colors";
import { toPascalCase } from "@/utils/string";

type CredentialClaims = Record<string, string | number>;

type CredentialInfoProps = {
  claims: CredentialClaims;
  title?: string;
  excludeKeys?: string[];
  style?: any;
};

export const CredentialInfo = ({
  claims,
  title = "Credential Information",
  excludeKeys = ["raw"],
  style,
}: CredentialInfoProps) => {
  const portraitImage = claims.portrait;
  const hasPortrait =
    typeof portraitImage === "string" && portraitImage.startsWith("data:image");

  const fullName =
    claims.given_name && claims.family_name
      ? `${claims.family_name} ${claims.given_name}`
      : undefined;

  const renderNameSection = () => {
    if (!fullName) return null;
    return (
      <View style={styles.nameContainer}>
        <Text style={styles.nameText}>{fullName}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.dataInfoCard, style]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.boldText}>{title}</Text>
        </View>
      </View>

      <View style={styles.infoWrapper}>
        {hasPortrait && (
          <View style={styles.portraitContainer}>
            <Image
              source={{ uri: portraitImage }}
              style={styles.portraitImage}
              resizeMode="cover"
            />
          </View>
        )}
        {renderNameSection()}
        {Object.entries(claims)
          .filter(([key, value]) => {
            if (typeof value !== "string" && typeof value !== "number")
              return false;
            if (excludeKeys.includes(key)) return false;

            return !(
              typeof value === "string" && value.startsWith("data:image")
            );
          })
          .map(([key, value]) => (
            <View key={key} style={styles.infoRow}>
              <Text style={styles.infoLabelText}>{toPascalCase(key)}</Text>
              <Text style={styles.infoText}>{value.toString()}</Text>
            </View>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dataInfoCard: {
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
  },
  infoWrapper: {
    width: "100%",
    gap: 7,
  },
  boldText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  infoLabelText: {
    fontSize: 14,
    opacity: 0.5,
    flex: 1,
  },
  infoRow: {
    backgroundColor: "#faf8e3",
    padding: 10,
    gap: 4,
    borderRadius: 5,
  },
  portraitContainer: {
    alignItems: "center",
    marginTop: 15,
  },
  portraitImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  nameContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  nameText: {
    fontSize: 15,
    color: Colors.light.text,
  },
});
