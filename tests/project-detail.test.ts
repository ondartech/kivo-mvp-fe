import { describe, expect, it } from "vitest";

import { buildProjectDashboardParams } from "@/features/projects/branching";

describe("KIV-FE-190 Project detail dashboard contract", () => {
  it("uses one bounded dashboard request without a currency override", () => {
    const params = buildProjectDashboardParams();

    expect(params.get("recent")).toBe("5");
    expect(params.get("activity_limit")).toBe("10");
    expect(params.has("currency")).toBe(false);
  });

  it("allows bounded preview sizes without introducing domain filters", () => {
    const params = buildProjectDashboardParams({
      recent: 8,
      activityLimit: 25,
    });

    expect(params.toString()).toBe("recent=8&activity_limit=25");
  });
});
