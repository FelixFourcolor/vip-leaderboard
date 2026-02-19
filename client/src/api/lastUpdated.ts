import { toYyyyMm } from "@/utils/time";

export const lastUpdatedDate = await fetch("/api/last-updated")
	.then((res) => res.json())
	.then((timestamp) => new Date(timestamp));

export const lastUpdated = toYyyyMm(lastUpdatedDate);
