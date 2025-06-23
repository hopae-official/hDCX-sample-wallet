import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";
import logger from "./logger";

NfcManager.start();

export async function readNdef() {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    if (tag?.ndefMessage && tag.ndefMessage.length > 0) {
      const ndefRecord = tag.ndefMessage[0];

      if (ndefRecord.tnf === 1 && ndefRecord.type[0] === 84) {
        const text = Ndef.text.decodePayload(
          new Uint8Array(ndefRecord.payload)
        );

        logger.log("[NFC] Decoded text:", text);
        return text;
      }
    }
  } catch (e) {
    logger.error("[NFC] Error reading NDEF:", e);
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}

export async function writeNdef(value: string) {
  let result = false;

  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const bytes = Ndef.encodeMessage([Ndef.textRecord(value)]);

    if (bytes) {
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      result = true;
    }
  } catch (e) {
    logger.error("[NFC] Error:", e);
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
  return result;
}
