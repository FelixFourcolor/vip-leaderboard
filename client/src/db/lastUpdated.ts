import { toYyyyMm } from "@/utils/time";
import { getLastUpdated } from "./endpoints";

export const lastUpdatedDate = await getLastUpdated();

export const lastUpdated = toYyyyMm(lastUpdatedDate);
