import { describe, expect, it } from "vitest";
import { getDayType, getLocalDateString, getPoolForDayType, getWeekdayInTimezone } from "../../lib/game-logic/day-type.js";

// 2024-01-01 was a Monday (UTC), used as the reference week throughout.
const MON = new Date("2024-01-01T12:00:00.000Z");
const TUE = new Date("2024-01-02T12:00:00.000Z");
const WED = new Date("2024-01-03T12:00:00.000Z");
const THU = new Date("2024-01-04T12:00:00.000Z");
const FRI = new Date("2024-01-05T12:00:00.000Z");
const SAT = new Date("2024-01-06T12:00:00.000Z");
const SUN = new Date("2024-01-07T12:00:00.000Z");

describe("getDayType", () => {
  it("classifies Monday-Thursday as THEMED", () => {
    for (const d of [MON, TUE, WED, THU]) {
      expect(getDayType(d, "UTC")).toBe("THEMED");
    }
  });

  it("classifies Friday as CURVEBALL", () => {
    expect(getDayType(FRI, "UTC")).toBe("CURVEBALL");
  });

  it("classifies Saturday and Sunday as WEEKEND", () => {
    expect(getDayType(SAT, "UTC")).toBe("WEEKEND");
    expect(getDayType(SUN, "UTC")).toBe("WEEKEND");
  });

  it("respects the room's timezone across a UTC day boundary", () => {
    // 2024-01-05T23:30 UTC is still Friday in UTC, but already Saturday in a
    // timezone many hours ahead (e.g. Pacific/Auckland, UTC+13).
    const lateFridayUtc = new Date("2024-01-05T23:30:00.000Z");
    expect(getDayType(lateFridayUtc, "UTC")).toBe("CURVEBALL");
    expect(getDayType(lateFridayUtc, "Pacific/Auckland")).toBe("WEEKEND");
  });

  it("respects the room's timezone behind UTC too", () => {
    // 2024-01-06T02:00 UTC is Saturday in UTC, but still Friday night in
    // US/Pacific (UTC-8), so it should still be a CURVEBALL day there.
    const earlySaturdayUtc = new Date("2024-01-06T02:00:00.000Z");
    expect(getDayType(earlySaturdayUtc, "UTC")).toBe("WEEKEND");
    expect(getDayType(earlySaturdayUtc, "America/Los_Angeles")).toBe("CURVEBALL");
  });
});

describe("getWeekdayInTimezone", () => {
  it("returns 0-6 for Sun-Sat", () => {
    expect(getWeekdayInTimezone(SUN, "UTC")).toBe(0);
    expect(getWeekdayInTimezone(MON, "UTC")).toBe(1);
    expect(getWeekdayInTimezone(SAT, "UTC")).toBe(6);
  });
});

describe("getLocalDateString", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(getLocalDateString(MON, "UTC")).toBe("2024-01-01");
  });
});

describe("getPoolForDayType", () => {
  it("maps THEMED to the current level", () => {
    expect(getPoolForDayType("THEMED", "REAL_TALK")).toBe("REAL_TALK");
  });

  it("maps CURVEBALL to CURVEBALL regardless of level", () => {
    expect(getPoolForDayType("CURVEBALL", "GO_DEEP")).toBe("CURVEBALL");
  });

  it("maps WEEKEND to null", () => {
    expect(getPoolForDayType("WEEKEND", "WARMUP")).toBeNull();
  });
});
