import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Ionicons } from "@expo/vector-icons";
import { decodeSDJWT } from "@/utils";
import {
  Claim,
  CREDENTIALS_STORAGE_KEY,
  Credential,
  CredentialInfoMap,
} from "@/types";
import { Button } from "@/components/ui/button";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { isValidClaim } from "@/utils";
import { useSharedValue } from "react-native-reanimated";
import { Colors } from "@/constants/Colors";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decodeJWT } from "@vdcs/jwt";
import { useWallet } from "@/contexts/WalletContext";

const requiredClaims = ["iss", "vct"];

export default function SelectCredentialScreen() {
  const walletSDK = useWallet();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const credential = credentials[0]?.credential;
  const selectedCredential = credentials[currentIndex]?.credential;

  const params = useLocalSearchParams<{ requestUri: string }>();
  const requestUri = params.requestUri;

  useEffect(() => {
    if (!requestUri) return;

    (async function requestAuthorization() {
      const res = await axios.get(requestUri);
      console.log("Verify request:", res.data);

      const requestObject = res.data;

      const parsedRequestObject = decodeJWT(requestObject);

      console.log("Parsed request object:", parsedRequestObject);
    })();
  }, [requestUri]);

  const claims: Claim | null = credential
    ? (() => {
        const decoded = decodeSDJWT(credential).claims;
        return isValidClaim<Claim>(decoded, ["iss", "vct"]) ? decoded : null;
      })()
    : null;

  const handlePressAccept = () => {
   
  };

  const handlePressDeny = () => {
    router.dismissAll();
    router.push({ pathname: "/" });
  };

  const ref = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    });
  };

  const [selectedOptions, setSelectedOptions] = useState({
    iss: true, // required
    vct: true, // required
    ...claims,
  });

  const toggleOption = (option: keyof typeof selectedOptions) => {
    if (requiredClaims.includes(option)) return;

    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  useFocusEffect(
    useCallback(() => {
      const loadCredentials = async () => {
        const storedCredentials = await AsyncStorage.getItem(
          CREDENTIALS_STORAGE_KEY
        );

        setCredentials(storedCredentials ? JSON.parse(storedCredentials) : []);
      };

      loadCredentials();
    }, [])
  );

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
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollViewContent}
        bounces={false}
      >
        <Text style={styles.title}>
          An organization is asking for information
        </Text>

        <View
          style={{ width: "100%", backgroundColor: Colors.light.background }}
        >
          <Carousel
            ref={ref}
            style={{
              width: "100%",
              height: 220,
              justifyContent: "center",
            }}
            width={310}
            height={300}
            data={credentials}
            loop={false}
            onProgressChange={progress}
            onScrollEnd={(_index) => {
              setCurrentIndex(_index);
              console.log("scroll end index:", _index);
            }}
            snapEnabled={true}
            renderItem={({ index, item }) => (
              <View style={styles.credentialCardWrapper}>
                <Card style={styles.credentialCard}>
                  <ImageBackground
                    source={require("@/assets/images/card_bg.jpg")}
                    style={styles.contentContainer}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.circleImage}>
                        <Ionicons
                          name="wallet-outline"
                          size={24}
                          color={"gray"}
                        />
                      </View>
                      <Text style={styles.cardText}>
                        {CredentialInfoMap[item.type]?.label}
                      </Text>
                    </View>
                  </ImageBackground>
                </Card>
              </View>
            )}
          />

          <Pagination.Basic
            progress={progress}
            data={credentials}
            dotStyle={{ backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 50 }}
            containerStyle={{ gap: 5, marginTop: 10 }}
            onPress={onPressPagination}
          />
        </View>
        <Card style={styles.providerCard}>
          <View style={styles.circleImage}>
            <Ionicons name="newspaper" size={15} color={"gray"} />
          </View>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.boldText}>{claims.iss}</Text>
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={"green"}
              opacity={0.5}
            />
          </View>
          <Ionicons name="chevron-down" size={24} />
        </Card>

        <View style={styles.dataInfoContainer}>
          <Card style={styles.dataInfoCard}>
            <View style={styles.cardHeader}>
              <View style={styles.infoCircleImage}>
                <Ionicons name="newspaper" size={15} color={"gray"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.boldText}>Information</Text>
              </View>
            </View>

            <Card style={styles.infoWrapper}>
              {Object.entries(claims)
                .filter(([_, value]) => {
                  if (typeof value !== "string") return false;

                  return !value.startsWith("data:image");
                })
                .map(([key, value]) => (
                  <View style={styles.optionWrapper} key={key}>
                    <TouchableOpacity
                      onPress={() =>
                        toggleOption(key as keyof typeof selectedOptions)
                      }
                      disabled={requiredClaims.includes(key)}
                    >
                      <Ionicons
                        name="checkbox-outline"
                        size={20}
                        color={
                          requiredClaims.includes(key)
                            ? "black"
                            : selectedOptions[
                                key as keyof typeof selectedOptions
                              ]
                            ? "green"
                            : "lightgray"
                        }
                      />
                    </TouchableOpacity>
                    <View>
                      <Text style={styles.infoLabelText}>
                        {key.replace(/_/g, " ").toUpperCase()}
                        {requiredClaims.includes(key) && " (required)"}
                      </Text>
                      <Text style={styles.infoText}>{value}</Text>
                    </View>
                  </View>
                ))}
            </Card>
          </Card>
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            variant={"default"}
            style={styles.acceptButton}
            onPress={handlePressAccept}
          >
            <Text style={styles.acceptButtonText}>Submit</Text>
          </Button>
          <Button
            variant={"default"}
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
  descWrapper: {
    gap: 8,
    borderColor: "black",
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    height: 400,
    justifyContent: "center",
    alignItems: "center",
  },
  boldText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  text: {
    fontSize: 16,
    color: "#000",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  loadingSpinner: {
    marginTop: 20,
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
    gap: 8,
    marginTop: 20,
  },
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
  circleImage: {
    width: 35,
    height: 35,
    borderRadius: 35 / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "lightgray",
    backgroundColor: "white",
    margin: 3,
  },
  providerCard: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 20,
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.border,
  },
  verifiedDescWapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 3,
  },
  decsText: {
    color: "green",
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
    //borderColor: Colors.light.border,
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
  infoLabelText: {
    fontSize: 15,
    opacity: 0.5,
    color: "#000",
  },
  infoText: {
    fontSize: 15,
    opacity: 0.7,
    color: "#000",
  },
  infoCircleImage: {
    width: 35,
    height: 35,
    borderRadius: 35 / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "lightgray",
    backgroundColor: "white",
    marginRight: 4,
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
  optionWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
