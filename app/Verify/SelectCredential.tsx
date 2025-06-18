import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Ionicons } from "@expo/vector-icons";
import { RequestObject, StoredCredential } from "@/types";
import { Button } from "@/components/ui/button";
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { Colors } from "@/constants/Colors";
import { useWallet } from "@/contexts/WalletContext";
import { InfoItem } from "@/components/InfoItem";
import { CircleIcon } from "@/components/CircleIcon";
import { CredentialCard } from "@/components/CredentialCard";
import { ProviderInfo } from "@/components/ProviderInfo";
import { useCredentialCarousel } from "@/hooks/useCredentialCarousel";

// Constants
const REQUIRED_CLAIMS = ["iss", "vct"] as const;
const PRESENTATION_FRAME = {
  family_name: true,
  given_name: true,
  birth_date: true,
  age_over_18: true,
  issuance_date: true,
  expiry_date: true,
  issuing_country: true,
  issuing_authority: true,
} as const;

export default function SelectCredentialScreen() {
  const walletSDK = useWallet();
  const [requestObject, setRequestObject] = useState<RequestObject>();
  const {
    credentials,
    setCredentials,
    selectedCredential,
    carouselRef,
    progress,
    setCurrentIndex,
    onPressPagination,
  } = useCredentialCarousel();

  const claims = selectedCredential;

  const params = useLocalSearchParams<{ requestUri: string }>();
  const { requestUri } = params;

  const [selectedOptions, setSelectedOptions] = useState({
    ...claims,
    iss: true,
    vct: true,
  });

  // Load request object
  useEffect(() => {
    if (!requestUri) return;

    const loadRequestObject = async () => {
      try {
        const reqObject = await walletSDK.load(requestUri);
        if (!reqObject) throw new Error("Failed to load request object");
        setRequestObject(reqObject);
      } catch (error) {
        Alert.alert("Error", "Failed to load request object");
        router.push({ pathname: "/" });
      }
    };

    loadRequestObject();
  }, [requestUri]);

  // Load credentials
  useFocusEffect(
    useCallback(() => {
      const loadCredentials = async () => {
        try {
          if (!requestObject) return;
          const storedCredentials = await walletSDK
            .selectCredentials
            //requestObject.dcql_query
            ();
          setCredentials(
            storedCredentials ? JSON.parse(storedCredentials) : []
          );
        } catch (error) {
          console.error("Failed to load credentials", error);
        }
      };

      loadCredentials();
    }, [requestObject])
  );

  const handlePressSubmit = async () => {
    if (!walletSDK || !selectedCredential?.raw || !requestObject) return;

    try {
      const result = await walletSDK.present(
        selectedCredential.raw,
        PRESENTATION_FRAME,
        requestObject
      );

      if (result) {
        router.push({ pathname: "/Verify/VerifyResult" });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to verify credential";
      Alert.alert("Error", errorMessage);
    }
  };

  const handlePressDeny = () => {
    router.dismissAll();
    router.push({ pathname: "/" });
  };

  const toggleOption = (option: keyof typeof selectedOptions) => {
    if (REQUIRED_CLAIMS.includes(option as any)) return;
    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  if (!claims) return <Text>No claims</Text>;

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={27} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollViewContent}
        bounces={false}
      >
        <Text style={styles.title}>
          An organization is asking for information
        </Text>

        <View style={styles.carouselContainer}>
          <Carousel
            ref={carouselRef}
            style={styles.carousel}
            width={310}
            height={300}
            data={credentials}
            loop={false}
            onProgressChange={progress}
            onScrollEnd={setCurrentIndex}
            snapEnabled={true}
            renderItem={({ item }) => <CredentialCard issuer={item.iss} />}
          />
          <Pagination.Basic
            progress={progress}
            data={credentials}
            dotStyle={{ backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 50 }}
            containerStyle={{ gap: 5, marginTop: 10 }}
            onPress={onPressPagination}
          />
        </View>

        <ProviderInfo issuer={claims.iss} />

        <View style={styles.dataInfoContainer}>
          <Card style={styles.dataInfoCard}>
            <View style={styles.cardHeader}>
              <CircleIcon name="newspaper" />
              <View style={{ flex: 1 }}>
                <Text style={styles.boldText}>Information</Text>
              </View>
            </View>

            <Card style={styles.infoWrapper}>
              {Object.entries(claims)
                .filter(([key, value]) => {
                  if (typeof value !== "string" && typeof value !== "number")
                    return false;
                  if (key === "raw") return false;
                  return !(
                    typeof value === "string" && value.startsWith("data:image")
                  );
                })
                .map(([key, value]) => (
                  <InfoItem
                    key={key}
                    label={key}
                    value={value as string | number}
                    isRequired={REQUIRED_CLAIMS.includes(key as any)}
                    isSelected={
                      !!selectedOptions[key as keyof typeof selectedOptions]
                    }
                    onToggle={() =>
                      toggleOption(key as keyof typeof selectedOptions)
                    }
                  />
                ))}
            </Card>
          </Card>
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            variant="default"
            style={styles.acceptButton}
            onPress={handlePressSubmit}
          >
            <Text style={styles.acceptButtonText}>Submit</Text>
          </Button>
          <Button
            variant="default"
            style={styles.denyButton}
            onPress={handlePressDeny}
          >
            <Text>Cancel</Text>
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingTop: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
    alignSelf: "flex-start",
    marginStart: 20,
  },
  carouselContainer: {
    width: "100%",
  },
  carousel: {
    width: "100%",
    height: 220,
    justifyContent: "center",
  },
  boldText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  dataInfoContainer: {
    width: "100%",
    alignItems: "center",
    flex: 1,
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
  },
  infoWrapper: {
    padding: 10,
    borderRadius: 5,
    width: "100%",
    gap: 15,
    backgroundColor: Colors.light.background,
    borderColor: "transparent",
  },
  buttonWrapper: {
    marginVertical: 30,
    width: "90%",
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
