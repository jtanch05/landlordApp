import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const workspacePageSource = readFileSync(
  "app/(app)/properties/[propertyId]/page.tsx",
  "utf8",
);

describe("property workspace tab navigation", () => {
  it("does not switch workspace modules through property route query links", () => {
    assert.equal(
      workspacePageSource.includes("href={`/properties/${property.id}?tab=${tab.id}`}"),
      false,
    );
  });
});
