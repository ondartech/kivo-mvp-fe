import { describe, expect, it } from "vitest";

import { numberingReferenceExample } from "@/features/organization/numbering";

describe("FE-NUM-001 numbering presentation", () => {
  it("renders Organization-scoped examples without a Branch segment", () => {
    expect(
      numberingReferenceExample({
        prefix: "INV",
        width: 4,
        scope: "ORGANIZATION",
      }),
    ).toBe("INV-0001");
  });

  it("renders Branch-scoped examples with the immutable Branch code", () => {
    expect(
      numberingReferenceExample(
        {
          prefix: "QTE",
          width: 6,
          scope: "BRANCH",
        },
        "ABJ",
      ),
    ).toBe("QTE-ABJ-000001");
  });

  it("uses the server-supplied width rather than document-specific UI rules", () => {
    expect(
      numberingReferenceExample({
        prefix: "DOC",
        width: 2,
        scope: "ORGANIZATION",
      }),
    ).toBe("DOC-01");
  });
});
