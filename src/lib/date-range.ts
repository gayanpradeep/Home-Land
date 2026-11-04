// Asia/Colombo is a fixed UTC+5:30 offset year-round (no DST), so boundaries
// can be computed with simple arithmetic instead of a timezone library.
const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "previousMonth";

function colomboDateParts(instant: Date): { year: number; month: number; day: number } {
  const shifted = new Date(instant.getTime() + COLOMBO_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function startOfColomboDay(year: number, month: number, day: number): Date {
  // UTC instant for 00:00 Colombo time on the given calendar day.
  return new Date(Date.UTC(year, month, day) - COLOMBO_OFFSET_MS);
}

export function resolveDateRange(preset: DateRangePreset, now: Date = new Date()): { from: Date; to: Date } {
  const { year, month, day } = colomboDateParts(now);
  const startOfToday = startOfColomboDay(year, month, day);
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  switch (preset) {
    case "today":
      return { from: startOfToday, to: startOfTomorrow };
    case "yesterday": {
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      return { from: startOfYesterday, to: startOfToday };
    }
    case "last7days":
      return { from: new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000), to: startOfTomorrow };
    case "last30days":
      return { from: new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000), to: startOfTomorrow };
    case "thisMonth":
      return { from: startOfColomboDay(year, month, 1), to: startOfTomorrow };
    case "previousMonth": {
      const prevMonthStart = startOfColomboDay(year, month - 1, 1);
      const thisMonthStart = startOfColomboDay(year, month, 1);
      return { from: prevMonthStart, to: thisMonthStart };
    }
    default:
      return { from: startOfToday, to: startOfTomorrow };
  }
}
