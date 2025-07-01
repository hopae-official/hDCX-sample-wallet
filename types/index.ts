import { Format } from "@hdcx/wallet-core";

export type Claim = {
  iss: string;
  vct: string;
  [key: string]: string;
};

export const CREDENTIALS_STORAGE_KEY = "@credentials";

export type Credential = {
  format: Format;
  credential: string;
};

export type StoredCredential = {
  raw: string;
  iss: string;
  vct: string;
  [key: string]: unknown;
};

export type AnimoCredentialResponse = {
  credential: string;
};

export type CredentialClaims = Record<string, string>;
