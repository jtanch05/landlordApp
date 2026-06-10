import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeWorkspaceTab,
  propertyWorkspaceTabs,
} from "./workspace-tabs.ts";

describe("normalizeWorkspaceTab", () => {
  it("keeps a known tab value", () => {
    assert.equal(normalizeWorkspaceTab("tenants"), "tenants");
  });

  it("falls back to overview for unknown or missing tab values", () => {
    assert.equal(normalizeWorkspaceTab(undefined), "overview");
    assert.equal(normalizeWorkspaceTab("unknown"), "overview");
  });
});

describe("propertyWorkspaceTabs", () => {
  it("uses Ledger as the user-facing rent tab label", () => {
    const rentTab = propertyWorkspaceTabs.find((tab) => tab.id === "rent");

    assert.equal(rentTab?.label, "Ledger");
  });
});
