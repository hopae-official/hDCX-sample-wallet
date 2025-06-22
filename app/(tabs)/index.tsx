import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useState, useCallback } from "react";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "@/components/ui/button";
import { Claim } from "@/types";
import { useWallet } from "@/contexts/WalletContext";
import logger from "../../utils/logger";
import { CredentialCard } from "@/components/CredentialCard";
import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";

// Pre-step, call this before any NFC operations
NfcManager.start();

export default function HomeScreen() {
  const walletSDK = useWallet();
  const [credentials, setCredentials] = useState<Claim[]>([]);

  async function readNdef() {
    try {
      // register for the NFC tag with NDEF in it
      await NfcManager.requestTechnology(NfcTech.Ndef);
      // the resolved tag object will contain `ndefMessage` property
      const tag = await NfcManager.getTag();
      
      if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
        // Get the first NDEF record
        const ndefRecord = tag.ndefMessage[0];
        
        // Decode the payload if it's a text record (TNF === 1 and type === [84] which is 'T')
        if (ndefRecord.tnf === 1 && ndefRecord.type[0] === 84) {
          const text = Ndef.text.decodePayload(ndefRecord.payload);
          console.log('[NFC] Decoded text:', text);
        }
      }
    } catch (ex) {
      console.warn("Oops!", ex, JSON.stringify(ex));
    } finally {
      // stop the nfc scanning
      NfcManager.cancelTechnologyRequest();
    }
  }

  async function writeNdef({ type, value }: { type: string; value: string }) {
    let result = false;

    try {
      // STEP 1: NFC 태그와의 통신을 시작
      console.log('[NFC] STEP 1: Requesting NFC technology...');
      await NfcManager.requestTechnology(NfcTech.Ndef);
      console.log('[NFC] STEP 1: NFC tag detected');

      // STEP 2: NDEF 메시지 생성 및 인코딩
      console.log('[NFC] STEP 2: Creating NDEF message...');
      const bytes = Ndef.encodeMessage([Ndef.textRecord("Hello NFC")]);
      console.log('[NFC] STEP 2: Message encoded:', bytes ? 'success' : 'failed');

      if (bytes) {
        // STEP 3: NFC 태그에 쓰기
        console.log('[NFC] STEP 3: Writing to NFC tag...');
        await NfcManager.ndefHandler
          .writeNdefMessage(bytes);
        console.log('[NFC] STEP 3: Write successful');
        result = true;
      }
    } catch (ex) {
      console.warn('[NFC] Error:', ex);
    } finally {
      // STEP 4: NFC 세션 종료
      console.log('[NFC] STEP 4: Cleaning up NFC session...');
      NfcManager.cancelTechnologyRequest();
      console.log('[NFC] STEP 4: Cleanup complete');
    }

    return result;
  }
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
          <TouchableOpacity onPress={readNdef}>
            <Text>Scan a Tag</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => writeNdef({ type: "text", value: "Hello NFC" })}>
            <Text>Write a Tag2</Text>
          </TouchableOpacity>
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
});
