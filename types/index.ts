import { rawDCQL } from "@vdcs/dcql";
import { Format } from "@vdcs/oid4vci";

export type CredentialOffer = {
  credential_issuer: string;
  credential_configuration_ids: Array<string>;
  grants: {
    "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
      "pre-authorized_code": string;
      tx_code: {
        length: number;
        input_mode: string;
        descreption: string;
      };
    };
  };
};

export type Claim = {
  iss: string;
  vct: string;
  [key: string]: string;
};

export type CredentialType =
  | "UniversityDegreeCredential"
  | "DriverLicenseCredential"
  | "VaccinationCredential";

export const CREDENTIALS_STORAGE_KEY = "@credentials";

export type Credential = {
  format: Format;
  credential: string;
};

export const CredentialInfoMap: Record<
  CredentialType,
  { label: string; icon: string }
> = {
  UniversityDegreeCredential: { label: "University Diploma", icon: "school" },
  DriverLicenseCredential: { label: "Driver's License", icon: "car" },
  VaccinationCredential: {
    label: "Vaccination Certificate",
    icon: "hospital-box",
  },
} as const;

export type StoredCredential = {
  raw: string;
  iss: string;
  vct: string;
  [key: string]: unknown;
};

// @Todo: export this type from hDCX-js
export type RequestObject = {
  response_type: string;
  client_id: string;
  response_uri: string;
  response_mode: "direct_post" | "direct_post.jwt";
  nonce: string;
  dcql_query: rawDCQL;
  state?: string;
};