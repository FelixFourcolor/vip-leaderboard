import LAST_UPDATE from "virtual:db/last-update";
import { monthsInRange, timeOffset, toYyyyMm } from "@/utils/time";

// Earliest month with meaningful data.
// Kinda hard to define "meaningful",
// so just hardcode a value instead of querying it
export const FIRST_MONTH = "2020-01";
export const LAST_MONTH = toYyyyMm(LAST_UPDATE);

export const TWO_YEARS_AGO = timeOffset(LAST_MONTH, { years: -2, months: 1 });
export const ALL_MONTHS = monthsInRange(FIRST_MONTH, LAST_MONTH);
