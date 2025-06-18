import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/button";
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { Colors } from "@/constants/Colors";
import { CredentialCard } from "@/components/CredentialCard";
import { ProviderInfo } from "@/components/ProviderInfo";
import { useCredentialCarousel } from "@/hooks/useCredentialCarousel";
import { useVerificationFlow } from "@/hooks/useCredentialVerification";
import { FullscreenLoader } from "@/components/FullscreenLoader";
import { ClaimSelector } from "@/components/ClaimSelector";
import { useClaimSelector } from "@/hooks/useClaimSelector";

export default function SelectCredentialScreen() {
  const { requestUri } = useLocalSearchParams<{ requestUri: string }>();

  const {
    isLoading: isVerificationLoading,
    loadRequestObject,
    loadCredentials,
    presentCredential,
    REQUIRED_CLAIMS,
  } = useVerificationFlow(requestUri);

  const {
    credentials,
    setCredentials,
    selectedCredential,
    carouselRef,
    progress,
    setCurrentIndex,
    onPressPagination,
  } = useCredentialCarousel();

  const isLoading = !selectedCredential;

  const { selectedOptions, toggleOption } = useClaimSelector(
    selectedCredential,
    REQUIRED_CLAIMS
  );

  useEffect(() => {
    (async function load() {
      const result = await loadRequestObject();

      if (!result.isSuccess) {
        router.push({ pathname: "/" });
      }
    })();
  }, [loadRequestObject]);

  useEffect(() => {
    (async function fetchCredentials() {
      const creds = await loadCredentials();
      setCredentials(creds);
    })();
  }, [loadCredentials]);

  const handlePressPresent = async () => {
    if (isVerificationLoading) return;

    if (selectedCredential) {
      await presentCredential(selectedCredential);

      router.push({ pathname: "/Verify/VerifyResult" });
    }
  };

  const handlePressDeny = () => {
    router.dismissAll();
    router.push({ pathname: "/" });
  };

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
          headerShown: !isLoading,
        }}
      />
      <FullscreenLoader isLoading={isLoading}>
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
              data={credentials ?? []}
              loop={false}
              onProgressChange={progress}
              onScrollEnd={setCurrentIndex}
              snapEnabled={true}
              renderItem={({ item }) => <CredentialCard issuer={item.iss} />}
            />
            <Pagination.Basic
              progress={progress}
              data={credentials ?? []}
              dotStyle={{
                backgroundColor: "rgba(0,0,0,0.2)",
                borderRadius: 50,
              }}
              containerStyle={{ gap: 5, marginTop: 10 }}
              onPress={onPressPagination}
            />
          </View>

          <ProviderInfo issuer={selectedCredential?.iss ?? ""} />

          <View style={styles.dataInfoContainer}>
            <ClaimSelector
              credential={selectedCredential}
              selectedOptions={selectedOptions}
              onToggleOption={toggleOption}
              requiredClaims={REQUIRED_CLAIMS}
            />
          </View>

          <View style={styles.buttonWrapper}>
            <Button
              variant="default"
              style={styles.acceptButton}
              onPress={handlePressPresent}
            >
              <Text style={styles.acceptButtonText}>Present</Text>
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
      </FullscreenLoader>
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
  dataInfoContainer: {
    width: "100%",
    alignItems: "center",
    flex: 1,
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
