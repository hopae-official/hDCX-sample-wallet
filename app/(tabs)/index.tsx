import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/card";

import { useState, useCallback } from "react";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "@/components/ui/button";
import { Claim } from "@/types";
import { useWallet } from "@/contexts/WalletContext";
import logger from "../utils/logger";

export default function HomeScreen() {
  const walletSDK = useWallet();
  const [credentials, setCredentials] = useState<Claim[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async function loadCredentials() {
        try {
          const storedCredentials = JSON.parse(
            await walletSDK.selectCredentials()
          );

          setCredentials(storedCredentials);
        } catch (e) {
          logger.error(e);
        }
      })();
    }, [])
  );

  const handlePressCredential = (credential: Record<string, unknown>) => {
    router.navigate({
      pathname: "/Issue/CredentialDetail",
      params: { credential: JSON.stringify(credential) },
    });
  };

  const handlePressAddCredential = () => {
    router.navigate({
      pathname: "/Issue/CredentialTypeSelection",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {credentials.length > 0 ? (
        <View style={styles.listContainer}>
          <TouchableOpacity
            style={styles.addCredentialButton}
            onPress={handlePressAddCredential}
          >
            <Ionicons size={25} name="add" color={"white"} />
          </TouchableOpacity>

          <View style={styles.stackContainer}>
            {credentials.map((credential, index) => (
              <TouchableHighlight
                key={index}
                underlayColor={"transparent"}
                style={[
                  styles.cardWrapper,
                  {
                    top: index * CARD_OFFSET,
                    zIndex: credentials.length + index,
                  },
                ]}
                onPress={() => handlePressCredential(credential)}
              >
                <Card style={styles.credentialCard}>
                  <ImageBackground
                    source={require("@/assets/images/card_bg.jpg")}
                    style={styles.contentContainer}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.circleImage}>
                        <Ionicons size={28} name="wallet-outline" />
                      </View>
                      <Text style={styles.cardText}>{credential.iss}</Text>
                    </View>
                  </ImageBackground>
                </Card>
              </TouchableHighlight>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons size={80} name="wallet-outline" />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginTop: 20,
              padding: 20,
            }}
          >
            Welcome
          </Text>
          <Text style={{ fontSize: 13, color: "gray", textAlign: "center" }}>
            You don't have any credentials yet. To add your first credential,
            tap the button
          </Text>
          <Button
            variant="default"
            className="w-full shadow shadow-foreground/5 mt-5"
            style={{ width: "100%", backgroundColor: Colors.light.orange }}
            onPress={() => router.navigate("/Issue/CredentialTypeSelection")}
          >
            <Text style={{ color: "white" }}>Add a credential</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const CARD_OFFSET = 53;
const CARD_WIDTH = 350;
const CARD_HEIGHT = CARD_WIDTH / 1.58;

const styles = StyleSheet.create({
  addCredentialButton: {
    position: "absolute",
    top: 30,
    right: 30,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.orange,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  button: {
    backgroundColor: Colors.light.lightBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  stackContainer: {
    width: CARD_WIDTH,
    position: "relative",
    marginTop: 100,
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
  qrButton: {
    alignSelf: "flex-end",
    marginRight: 10,
    backgroundColor: "blue",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  credentialWrapper: {
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 20,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    alignItems: "center",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  credentialCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "gray",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    overflow: "hidden",
  },
  contentContainer: {
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
  circleImage: {
    width: 50,
    height: 50,
    borderRadius: 50 / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "lightgray",
    backgroundColor: "white",
  },
});
