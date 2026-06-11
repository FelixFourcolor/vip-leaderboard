import { createContext, use } from "react";
import type { YyyyMm } from "@/utils/time";
import type { Maybe, State } from "@/utils/types";

interface ZoomContextValue
	extends State<{
		xZoom: { sinceOffset: number; untilOffset: number };
		yZoom: { minOffset: number; maxOffset: number };
		chartHeight: Maybe<number>;
		chartWidth: Maybe<number>;
	}> {
	xValues: readonly YyyyMm[];
	yRange: { min: number; max: number };
	clipPathId: string;
}

export const ZoomContext = createContext<ZoomContextValue | null>(null);

export function useChartZoom() {
	const context = use(ZoomContext);
	if (!context) {
		throw new Error("useChartZoom must be used within ZoomContext");
	}
	return context;
}
