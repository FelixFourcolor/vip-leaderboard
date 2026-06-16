import { createContext, use } from "react";
import type { YyyyMm } from "@/utils/time";
import type { Maybe, State } from "@/utils/types";

export interface ZoomContextValue
	extends State<{
		xZoom: readonly [startOffset: number, endOffset: number];
		yZoom: readonly [startOffset: number, endOffset: number];
		chartHeight: Maybe<number>;
		chartWidth: Maybe<number>;
		isInteracting: boolean;
	}> {
	xValues: readonly YyyyMm[];
	yRange: Readonly<{ min: number; max: number }>;
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
