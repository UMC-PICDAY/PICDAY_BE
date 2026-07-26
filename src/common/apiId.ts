// DB(Prisma)의 PK는 bigint지만, JS의 number는 안전하게 표현 가능한 정수 범위가
// Number.MAX_SAFE_INTEGER(2^53-1)까지라서, API로 내보낼 수 있는 id의 상한값을 여기서 고정한다.
const MAX_SAFE_API_ID = BigInt(Number.MAX_SAFE_INTEGER);
// path param(예: /studios/:studioId)은 express가 항상 string으로 넘겨준다.
// 앞자리 0이 없는 1 이상의 정수 문자열("0", "01", "-1", "1.5" 등은 전부 거부)만 허용.
const RAW_API_ID_PATTERN = /^[1-9]\d*$/;

// req.params로 들어오는 "raw" 문자열 id가 유효한 API id 형식인지 검사한다.
// (아직 숫자로 변환되기 전, 경로 파라미터 단계에서 쓰는 용도)
export function isValidRawApiId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    RAW_API_ID_PATTERN.test(value) &&
    BigInt(value) <= MAX_SAFE_API_ID
  );
}

// req.body/req.query 등 이미 JSON 파싱되어 number 타입으로 들어온 id 값을 검사한다.
// (JSON.parse가 숫자로 변환해준 이후 단계에서 쓰는 용도 — isValidRawApiId와 짝을 이룸)
export function isValidApiIdNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

// number <-> bigint 변환 용 함수들

// 1. number id -> DB 조회용 bigint 변환
// (Prisma where 절 등 DB 레이어에 넘기기 직전에 호출)
export function toDomainId(id: number): bigint {
  if (!isValidApiIdNumber(id)) {
    throw new Error("Domain ID must be a positive safe integer.");
  }

  return BigInt(id);
}

// 2. bigint id -> API 응답용 number 변환
// (응답 직렬화 직전에 호출)
export function toApiId(id: bigint): number {
  if (id < 1n || id > MAX_SAFE_API_ID) {
    throw new Error("API ID must be a positive safe integer.");
  }

  return Number(id);
}
