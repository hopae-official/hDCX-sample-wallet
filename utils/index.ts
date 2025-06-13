import { parseMDL } from "./mdl";
import { decodeSdJwtSync, getClaimsSync } from "@sd-jwt/decode";
import { hasher } from "@sd-jwt/hash";
import { Format } from "@/app/Issue/types";

export function decodeSDJWT(sdjwt: string) {
  const decoded = decodeSdJwtSync(sdjwt, hasher);
  const header = decoded.jwt.header;

  const claims = getClaimsSync(
    decoded.jwt.payload,
    decoded.disclosures,
    hasher
  );

  return { header, claims };
}

export function isValidClaim<T extends object>(
  value: unknown,
  keys: (keyof T)[]
): value is T {
  return (
    typeof value === "object" &&
    value !== null &&
    keys.every((key) => key in value)
  );
}

export function getCredentialClaims({
  credential,
  format,
}: {
  credential: string;
  format: Format;
}) {
  if (format === "mso_mdoc") {
    return parseMDL(credential);
  }

  if (format === "dc+sd-jwt") {
    return decodeSDJWT(credential).claims;
  }

  throw new Error("Unsupported format");
}
