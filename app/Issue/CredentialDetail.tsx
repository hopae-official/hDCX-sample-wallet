import { router, Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Card } from "@/components/ui/card";
import { Colors } from "@/constants/Colors";
import { CredentialInfo } from "@/components/CredentialInfo";

export default function CredentialDetailScreen() {
  const params = useLocalSearchParams<{
    credential: string;
  }>();

  const claims = JSON.parse(params.credential);

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
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        bounces={false}
      >
        <View style={styles.dataInfoContainer}>
          <CredentialInfo claims={claims} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  credentialCard: {
    width: "100%",
    height: 200,
    borderRadius: 10,
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
  circleImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "lightgray",
    backgroundColor: "white",
  },
  cardText: {
    color: "white",
    fontSize: 15,
    position: "absolute",
    top: 10,
    right: 10,
  },
  dataInfoContainer: {
    marginTop: 20,
    width: "100%",
  },
});
