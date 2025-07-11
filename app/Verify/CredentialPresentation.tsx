import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/button";
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { Colors } from "@/constants/Colors";
import { CredentialCard } from "@/components/CredentialCard";
import { ProviderInfo } from "@/components/ProviderInfo";
import { useCredentialCarousel } from "@/hooks/useCredentialCarousel";
import { FullscreenLoader } from "@/components/FullscreenLoader";
import { ClaimSelector } from "@/components/ClaimSelector";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useWallet } from "@/contexts/WalletContext";
import { StoredCredential } from "@/types";
import { RequestObject, PresentationSession } from "@hdcx/wallet-core";

export default function CredentialPresentationScreen() {
  const walletSDK = useWallet();
  const { requestUri } = useLocalSearchParams<{ requestUri: string }>();
  const [presentationSession, setPresentationSession] =
    useState<PresentationSession>();
  const [requiredClaims, setRequiredClaims] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, boolean>
  >({});
  const requestObject = presentationSession?.requestObject;

  const {
    isLoading: isVerificationLoading,
    withLoading: withVerificationLoading,
  } = useAsyncAction({
    errorTitle: "Verification Error",
  });

  const { isLoading, withLoading } = useAsyncAction({
    errorTitle: "Load Request Error",
  });

  const {
    credentials,
    setCredentials,
    selectedCredential,
    carouselRef,
    progress,
    setCurrentIndex,
    onPressPagination,
  } = useCredentialCarousel();

  useEffect(() => {
    if (!presentationSession || !selectedCredential) return;

    const { initialSelectedClaims, requiredClaims } =
      presentationSession.setSelectedCredential(selectedCredential);

    setSelectedOptions(initialSelectedClaims);
    setRequiredClaims(requiredClaims);
  }, [presentationSession, selectedCredential]);

  const toggleOption = useCallback(
    (option: string) => {
      if (!presentationSession) return;

      const updated = presentationSession.toggleClaim(option);
      setSelectedOptions(updated);
    },
    [presentationSession]
  );

  useEffect(() => {
    (async function loadRequestObject() {
      if (!requestUri) {
        throw new Error("Cannot load request object: Missing request URI");
      }

      const result = await withLoading(async () => {
        const presentationSession = await walletSDK.load(requestUri);
        setPresentationSession(presentationSession);
        return { isSuccess: true };
      }, "Failed to load request object");

      if (!result.isSuccess) {
        router.push({ pathname: "/" });
      }
    })();
  }, [requestUri, walletSDK, withLoading]);

  useEffect(() => {
    (async function fetchCredentials() {
      if (!requestObject) return;

      try {
        const storedCredentials = await walletSDK.selectCredentials(
          requestObject.dcql_query
        );

        setCredentials(storedCredentials ? JSON.parse(storedCredentials) : []);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load credentials";
        Alert.alert("Error:", errorMessage);
        setCredentials([]);
      }
    })();
  }, [requestObject, walletSDK]);

  const presentCredential = useCallback(
    async (
      credential: StoredCredential
    ): Promise<{
      isSuccess: boolean;
      error?: string;
    }> => {
      if (!walletSDK || !credential?.raw || !requestObject)
        throw new Error(
          "Cannot present credential: Missing required data. Please ensure wallet is initialized and credential is valid."
        );

      return withVerificationLoading(async () => {
        try {
          const result = await walletSDK.present(
            credential.raw,
            selectedOptions,
            requestObject
          );

          return {
            isSuccess: !!result,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to verify credential";

          Alert.alert("Error:", errorMessage);
          return {
            isSuccess: false,
            error: errorMessage,
          };
        }
      });
    },
    [walletSDK, requestObject, selectedOptions, withVerificationLoading]
  );

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
      <FullscreenLoader
        isLoading={isLoading || isVerificationLoading}
        message={
          isVerificationLoading
            ? "Verifying your credential..."
            : "Loading credentials..."
        }
      >
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
              requiredClaims={requiredClaims}
            />
          </View>

          <View style={styles.buttonWrapper}>
            <Button
              variant="default"
              style={styles.acceptButton}
              onPress={handlePressPresent}
              disabled={isVerificationLoading}
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
    marginTop: 20,
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
