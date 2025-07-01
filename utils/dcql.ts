import { rawDCQL } from "@hdcx/wallet-core";

/**
 * Extracts required claim paths from a DCQL query
 * @param query DCQL query object
 * @returns Array of required claim paths in dot notation
 */
export function getRequiredClaimsFromDCQL(query: rawDCQL): string[] {
  if (!query?.credentials?.[0]?.claims) {
    return [];
  }

  return query.credentials[0].claims.map((claim) => claim.path.join("."));
}
