import { FIRST_DATE, LAST_UPDATE } from "virtual:db";
import { monthsInRange, timeOffset, toYyyyMm } from "@/utils/time";

export const FIRST_MONTH = toYyyyMm(FIRST_DATE);
export const LAST_MONTH = toYyyyMm(LAST_UPDATE);

export const TWO_YEARS_AGO = timeOffset(LAST_MONTH, { years: -2, months: 1 });
export const ALL_MONTHS = monthsInRange(FIRST_MONTH, LAST_MONTH);
