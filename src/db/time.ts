import { lastUpdated } from "virtual:db/last-updated";
import { monthsInRange } from "@/utils/time";

// Earliest month with meaningful data.
// Kinda hard to define "meaningful",
// so just hardcode a value instead of querying it
const FIRST_MONTH = "2020-01";

export const VALID_MONTHS = monthsInRange(FIRST_MONTH, lastUpdated);
