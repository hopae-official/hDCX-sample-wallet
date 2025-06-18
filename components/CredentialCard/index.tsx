import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { CircleIcon } from "../CircleIcon";

type CredentialCardProps = {
  issuer: string;
};

export const CredentialCard = ({ issuer }: CredentialCardProps) => (
  <View style={styles.credentialCardWrapper}>
    <Card style={styles.credentialCard}>
      <ImageBackground
        source={require("@/assets/images/card_bg.jpg")}
        style={styles.contentContainer}
      >
        <View style={styles.cardContent}>
          <CircleIcon name="wallet-outline" size={24} />
          <Text style={styles.cardText}>{issuer}</Text>
        </View>
      </ImageBackground>
    </Card>
  </View>
);

const styles = StyleSheet.create({
  credentialCardWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  credentialCard: {
    width: 300,
    height: 200,
    backgroundColor: "white",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    overflow: "hidden",
    marginTop: 10,
  },
  contentContainer: {
    backgroundColor: "transparent",
    flexDirection: "row",
    flex: 1,
    width: "100%",
  },
  cardContent: {
    padding: 10,
    flex: 1,
  },
  cardText: {
    color: "white",
    fontSize: 18,
    position: "absolute",
    bottom: 10,
    right: 10,
  },
});
