import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableHighlight,
} from "react-native";
import { Card } from "@/components/ui/card";
import { CircleIcon } from "../CircleIcon";

type CredentialCardProps = {
  issuer: string;
  width?: number;
  height?: number;
  top?: number;
  zIndex?: number;
  onPress?: () => void;
};

export const CredentialCard = ({
  issuer,
  width = 300,
  height = 200,
  top,
  zIndex,
  onPress,
}: CredentialCardProps) => (
  <TouchableHighlight
    underlayColor={"transparent"}
    style={[
      styles.cardWrapper,
      {
        top,
        zIndex,
      },
    ]}
    onPress={onPress}
  >
    <View style={styles.credentialCardWrapper}>
      <Card style={[styles.credentialCard, { width, height }]}>
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
  </TouchableHighlight>
);

const styles = StyleSheet.create({
  credentialCardWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  credentialCard: {
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
    fontSize: 15,
    position: "absolute",
    top: 10,
    right: 10,
  },
  cardWrapper: {
    position: "absolute",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
