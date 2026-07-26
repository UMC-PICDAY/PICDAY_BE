const MAX_SAFE_API_ID = BigInt(Number.MAX_SAFE_INTEGER);
const RAW_API_ID_PATTERN = /^[1-9]\d*$/;

export function isValidRawApiId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    RAW_API_ID_PATTERN.test(value) &&
    BigInt(value) <= MAX_SAFE_API_ID
  );
}

export function isValidApiIdNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

export function toDomainId(id: number): bigint {
  if (!isValidApiIdNumber(id)) {
    throw new Error("Domain ID must be a positive safe integer.");
  }

  return BigInt(id);
}

export function toApiId(id: bigint): number {
  if (id < 1n || id > MAX_SAFE_API_ID) {
    throw new Error("API ID must be a positive safe integer.");
  }

  return Number(id);
}
