// scripts/hotfix-reservation-terms.ts
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/config/prisma.js";
import type { TermsScope, TermsType } from "../src/generated/prisma/client.js";

const TERMS_RESERVATION_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "terms",
  "reservation",
);

const RESERVATION_TERMS: ReadonlyArray<{
  type: TermsType;
  scope: TermsScope;
  version: string;
  isRequired: boolean;
  file: string;
}> = [
  { type: "REFUND_POLICY", scope: "RESERVATION", version: "v1", isRequired: true, file: "refund.md" },
  { type: "PRIVACY_COLLECTION", scope: "RESERVATION", version: "v1-reserv", isRequired: true, file: "privacy.md" },
  { type: "THIRD_PARTY", scope: "RESERVATION", version: "v1", isRequired: true, file: "third_party.md" },
  { type: "PAYMENT_AGENCY", scope: "RESERVATION", version: "v1", isRequired: true, file: "payment_agency.md" },
];

async function main() {
  for (const term of RESERVATION_TERMS) {
    const content = readFileSync(join(TERMS_RESERVATION_DIR, term.file), "utf-8").trim();
    const row = await prisma.terms.upsert({
      where: { type_version: { type: term.type, version: term.version } },
      update: { content, scope: term.scope, isRequired: term.isRequired },
      create: { type: term.type, scope: term.scope, version: term.version, isRequired: term.isRequired, content },
      select: { id: true, type: true },
    });
    console.log(row.type, row.id.toString());
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());