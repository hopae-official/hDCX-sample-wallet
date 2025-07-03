import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useEffect } from "react";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "@/components/ui/button";
import { Claim } from "@/types";
import { useWallet } from "@/contexts/WalletContext";
import logger from "../../utils/logger";
import { CredentialCard } from "@/components/CredentialCard";

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
      pathname: "/QR",
    });
  };

  const handleScanTag = async () => {
    const result = await walletSDK.nfcService.readNdef();

    if (!result) return;

    const verifyRegex = /request_uri=([^&]*)/;
    const verifyMatch = result.match(verifyRegex);

    const issueRegex = /credential_offer_uri=([^&]+)/;
    const issueMatch = result.match(issueRegex);

    if (issueMatch && issueMatch[1]) {
      router.push({
        pathname: "/Issue/CredentialIssuance",
        params: { credentialOfferUri: result },
      });
    }

    if (verifyMatch && verifyMatch[1]) {
      router.push({
        pathname: "/Proximity",
        params: { requestUri: result },
      });
    }
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
              <CredentialCard
                key={index}
                issuer={credential.iss}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                top={index * CARD_OFFSET}
                zIndex={credentials.length + index}
                onPress={() => handlePressCredential(credential)}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.nfcButton} onPress={handleScanTag}>
            <Ionicons size={25} name="scan" color={"white"} />
          </TouchableOpacity>
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
            onPress={() => router.navigate("/QR")}
          >
            <Text style={{ color: "white" }}>Add a credential</Text>
          </Button>

          <View style={styles.bleContainer}></View>
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
  listContainer: {
    flex: 1,
    alignItems: "center",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 20,
  },
  bleContainer: {
    marginTop: 20,
    gap: 10,
    width: "100%",
  },
  nfcButton: {
    position: "absolute",
    bottom: 0,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: Colors.light.lightBlue,
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
});
