import type { CardLevel, DayType } from "./types.js";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Returns the 0(Sun)-6(Sat) weekday for `date` as observed in `timezone`. */
export function getWeekdayInTimezone(date: Date, timezone: string): number {
  const weekdayShort = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(date);
  const index = WEEKDAY_INDEX[weekdayShort];
  if (index === undefined) {
    throw new Error(`Could not determine weekday for timezone "${timezone}"`);
  }
  return index;
}

/** Returns the calendar date (YYYY-MM-DD) `date` falls on in `timezone`. */
export function getLocalDateString(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getDayType(date: Date, timezone: string): DayType {
  const weekday = getWeekdayInTimezone(date, timezone);
  if (weekday === 0 || weekday === 6) return "WEEKEND";
  if (weekday === 5) return "CURVEBALL";
  return "THEMED";
}

export function getPoolForDayType(
  dayType: DayType,
  currentLevel: CardLevel,
): CardLevel | null {
  if (dayType === "WEEKEND") return null;
  if (dayType === "CURVEBALL") return "CURVEBALL";
  return currentLevel;
}
