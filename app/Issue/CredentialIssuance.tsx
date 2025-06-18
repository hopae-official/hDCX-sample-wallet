import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Card } from "@/components/ui/card";
import { Colors } from "@/constants/Colors";
import { Button } from "@/components/ui/button";
import { useCredentialIssuanceFlow } from "@/hooks/useCredentialIssuanceFlow";
import { useEffect } from "react";
import { FullscreenLoader } from "@/components/FullscreenLoader";

export default function CredentialIssuanceScreen() {
  const { credentialOfferUri } = useLocalSearchParams<{
    credentialOfferUri: string;
  }>();

  const { isLoading, claims, saveCredential, receiveCredential } =
    useCredentialIssuanceFlow(credentialOfferUri);

  useEffect(() => {
    if (!credentialOfferUri) return;

    (async () => {
      const { isSuccess } = await receiveCredential(credentialOfferUri);

      if (!isSuccess) {
        router.replace("/");
      }
    })();
  }, [credentialOfferUri, receiveCredential]);

  const handlePressAccept = async () => {
    await saveCredential();

    router.replace("/");
  };
  const handleDeny = () => {
    router.replace("/");
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={27} />
            </TouchableOpacity>
          ),
          headerShown: !isLoading,
        }}
      />
      <FullscreenLoader isLoading={isLoading}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          bounces={false}
        >
          {claims && (
            <>
              <Text style={styles.title}>
                Would you like to add the credentials?
              </Text>
              <Card style={styles.providerCard}>
                <View style={styles.circleImage}>
                  <Ionicons name="newspaper" size={24} color="gray" />
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.boldText}>{claims.iss}</Text>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="green"
                  />
                </View>
                <Ionicons name="chevron-down" size={24} />
              </Card>
              <View style={styles.dataInfoContainer}>
                <Card style={styles.dataInfoCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.circleImage}>
                      <Ionicons name="newspaper" size={24} color="gray" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.boldText}>
                        Personal Identification Data
                      </Text>
                    </View>
                  </View>

                  <Card style={styles.infoWrapper}>
                    {Object.entries(claims)
                      .filter(([_, value]) => {
                        if (typeof value !== "string") return false;
                        return !value.startsWith("data:image");
                      })
                      .map(([key, value]) => (
                        <View key={key}>
                          <Text style={styles.infoLabelText}>
                            {key.replace(/_/g, " ").toUpperCase()}
                          </Text>
                          <Text style={styles.infoText}>{value}</Text>
                        </View>
                      ))}
                  </Card>
                </Card>
              </View>
              <View style={styles.buttonWrapper}>
                <Button
                  variant="default"
                  style={styles.acceptButton}
                  onPress={handlePressAccept}
                >
                  <Text style={styles.acceptButtonText}>Add</Text>
                </Button>
                <Button
                  variant="default"
                  style={styles.denyButton}
                  onPress={handleDeny}
                >
                  <Text>Cancel</Text>
                </Button>
              </View>
            </>
          )}
        </ScrollView>
      </FullscreenLoader>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    padding: 5,
    paddingTop: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    alignSelf: "flex-start",
    marginStart: 10,
  },
  providerCard: {
    width: "95%",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.border,
  },
  providerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  circleImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "lightgray",
    backgroundColor: "white",
  },
  dataInfoContainer: {
    width: "100%",
    alignItems: "center",
    flex: 1,
  },
  dataInfoCard: {
    marginTop: 10,
    width: "95%",
    alignItems: "center",
    padding: 15,
    backgroundColor: Colors.light.lightYellow,
    borderColor: Colors.light.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoWrapper: {
    padding: 10,
    borderColor: "transparent",
    borderRadius: 5,
    width: "95%",
    gap: 7,
    backgroundColor: Colors.light.background,
  },
  boldText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 15,
    opacity: 0.7,
  },
  infoLabelText: {
    fontSize: 15,
    opacity: 0.5,
  },
  buttonWrapper: {
    marginBottom: 30,
    width: "100%",
    padding: 10,
    gap: 5,
  },
  acceptButton: {
    backgroundColor: Colors.light.orange,
  },
  acceptButtonText: {
    color: "white",
  },
  denyButton: {
    borderWidth: 1,
    borderColor: "gray",
    backgroundColor: "white",
  },
});
