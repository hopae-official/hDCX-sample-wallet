import { router, Stack } from "expo-router";
import {
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
import { ClaimSelector } from "@/components/ClaimSelector";
import { useWallet } from "@/contexts/WalletContext";
import { useBleConnection } from "@/hooks/useBleConnection";
import logger from "@/utils/logger";
import { RequestObject } from "@hdcx/wallet-core";
import { getRequiredClaimsFromDCQL } from "@/utils/dcql";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { FullscreenLoader } from "@/components/FullscreenLoader";

export default function ProximityCredentialPresentationScreen() {
  const walletSDK = useWallet();
  const {
    credentials,
    setCredentials,
    selectedCredential,
    carouselRef,
    progress,
    setCurrentIndex,
    onPressPagination,
  } = useCredentialCarousel();

  const [requestObject, setRequestObject] = useState<RequestObject | null>(
    null
  );
  const [requiredClaims, setRequiredClaims] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!requestObject) return;

    const { initialOptions, requiredClaims } = walletSDK.sdService.initialize(
      selectedCredential,
      requestObject.dcql_query
    );

    setSelectedOptions(initialOptions);
    setRequiredClaims(requiredClaims);
  }, [selectedCredential, requestObject, walletSDK]);

  const toggleOption = useCallback(
    (option: string) => {
      const updated = walletSDK.sdService.toggle(option);
      setSelectedOptions(updated);
    },
    [walletSDK]
  );

  const {
    isLoading: isVerificationLoading,
    withLoading: withVerificationLoading,
  } = useAsyncAction({
    errorTitle: "Verification Error",
  });

  const { connectedDevice } = useBleConnection({
    onReceiveRequestObject: (value) => setRequestObject(value),
    onReceivePresentationResult: () => router.replace("/Verify/VerifyResult"),
  });

  useEffect(() => {
    if (!requestObject) return;

    const claims = getRequiredClaimsFromDCQL(requestObject.dcql_query);
    setRequiredClaims(claims);
  }, [requestObject]);

  useEffect(() => {
    (async function loadCredentials() {
      const storedCredentials = await walletSDK.selectCredentials();
      setCredentials(storedCredentials ? JSON.parse(storedCredentials) : []);
    })();
  }, []);

  const handlePressPresent = async () => {
    if (!selectedCredential || !requestObject || !connectedDevice) return;

    await withVerificationLoading(async () => {
      try {
        await walletSDK.bleService.present(
          connectedDevice,
          selectedCredential.raw,
          selectedOptions,
          requestObject
        );

        return { isSuccess: true };
      } catch (error) {
        logger.error("Error presenting credential:", error);
        return {
          isSuccess: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to present credential",
        };
      }
    });
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
        }}
      />
      <FullscreenLoader
        isLoading={isVerificationLoading}
        message={"Verifying your credential..."}
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
