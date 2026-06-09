export type AgreementType =
  | "custom"
  | "one_year"
  | "six_months"
  | "three_years"
  | "two_years";

type CalculateAgreementEndDateInput = {
  customEndDate?: string;
  startDate: string;
  type: AgreementType;
};

type GenerateRentScheduleInput = {
  amountDueCents: number;
  dueDay: number;
  endDate: string;
  startDate: string;
};

export type RentScheduleItem = {
  amountDueCents: number;
  dueDate: string;
  month: string;
};

export type RentStatus = "paid" | "partial" | "unpaid";

const agreementTypeMonths: Record<Exclude<AgreementType, "custom">, number> = {
  one_year: 12,
  six_months: 6,
  three_years: 36,
  two_years: 24,
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date: ${value}`);
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatMonth(date: Date) {
  return date.toISOString().slice(0, 7);
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addMonths(date: Date, months: number) {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

export function calculateAgreementEndDate({
  customEndDate,
  startDate,
  type,
}: CalculateAgreementEndDateInput) {
  if (type === "custom") {
    if (!customEndDate) {
      throw new Error("Custom agreements require an end date.");
    }

    return formatDate(parseDate(customEndDate));
  }

  const start = parseDate(startDate);
  const end = addMonths(start, agreementTypeMonths[type]);
  end.setUTCDate(end.getUTCDate() - 1);

  return formatDate(end);
}

export function generateRentSchedule({
  amountDueCents,
  dueDay,
  endDate,
  startDate,
}: GenerateRentScheduleInput): RentScheduleItem[] {
  if (amountDueCents < 0) {
    throw new Error("Rent amount cannot be negative.");
  }

  if (dueDay < 1 || dueDay > 31) {
    throw new Error("Rent due day must be between 1 and 31.");
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const schedule: RentScheduleItem[] = [];

  while (cursor <= endMonth) {
    const year = cursor.getUTCFullYear();
    const monthIndex = cursor.getUTCMonth();
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const clampedDueDay = Math.min(dueDay, daysInMonth);
    const dueDate = new Date(Date.UTC(year, monthIndex, clampedDueDay));

    schedule.push({
      amountDueCents,
      dueDate: formatDate(dueDate),
      month: formatMonth(cursor),
    });

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return schedule;
}

export function calculateRentStatus(
  amountPaidCents: number,
  amountDueCents: number,
): RentStatus {
  if (amountPaidCents <= 0) {
    return "unpaid";
  }

  if (amountPaidCents >= amountDueCents) {
    return "paid";
  }

  return "partial";
}
