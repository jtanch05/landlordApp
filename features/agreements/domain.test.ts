import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAgreementEndDate,
  calculateRentStatus,
  generateRentSchedule,
} from "./domain.ts";

test("calculates fixed-term agreement end dates inclusively", () => {
  assert.equal(
    calculateAgreementEndDate({
      startDate: "2026-01-15",
      type: "six_months",
    }),
    "2026-07-14",
  );

  assert.equal(
    calculateAgreementEndDate({
      startDate: "2026-01-15",
      type: "one_year",
    }),
    "2027-01-14",
  );
});

test("uses a custom agreement end date when type is custom", () => {
  assert.equal(
    calculateAgreementEndDate({
      customEndDate: "2026-09-30",
      startDate: "2026-03-01",
      type: "custom",
    }),
    "2026-09-30",
  );
});

test("generates monthly rent records for the full agreement term", () => {
  assert.deepEqual(
    generateRentSchedule({
      amountDueCents: 150000,
      dueDay: 5,
      endDate: "2026-03-20",
      startDate: "2026-01-15",
    }),
    [
      {
        amountDueCents: 150000,
        dueDate: "2026-01-05",
        month: "2026-01",
      },
      {
        amountDueCents: 150000,
        dueDate: "2026-02-05",
        month: "2026-02",
      },
      {
        amountDueCents: 150000,
        dueDate: "2026-03-05",
        month: "2026-03",
      },
    ],
  );
});

test("calculates rent status from paid and due amounts", () => {
  assert.equal(calculateRentStatus(0, 150000), "unpaid");
  assert.equal(calculateRentStatus(50000, 150000), "partial");
  assert.equal(calculateRentStatus(150000, 150000), "paid");
  assert.equal(calculateRentStatus(175000, 150000), "paid");
});
