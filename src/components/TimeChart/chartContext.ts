import { isEqual } from "es-toolkit";
import { createContext, type ReactElement, use } from "react";
import { toYyyyMm, type YyyyMm } from "@/utils/time";
import type { Maybe, State } from "@/utils/types";
import type { ChartSeries } from "./Chart";
import type { TimeSeries } from "./ChartWrapper";
import type { InteractivePoint } from "./layers/Interaction";
import type { PointTooltipProps } from "./layers/Points";

interface ChartContextValue<S extends TimeSeries = TimeSeries>
	extends State<{
		activeSeries: Maybe<string>;
		hoveredPoint: Maybe<InteractivePoint>;
	}> {
	seriesData: Maybe<readonly S[]>;
	chartData: Maybe<readonly ChartSeries[]>;
	setVisibleIdx: (range: [from: number, to: number]) => void;
	renderReady: boolean;
	xValues: readonly YyyyMm[];
	area: boolean;
	cumulative: boolean;
	ranked: boolean;
	colors: readonly string[];
	isolatedPoints: Record<string, Set<YyyyMm>>;
	PointTooltip: Maybe<(props: PointTooltipProps<S>) => ReactElement | null>;
}

export const ChartContext = createContext<ChartContextValue<any> | null>(null);

export function useChart<S extends TimeSeries = TimeSeries>() {
	const context = use(ChartContext) as ChartContextValue<S> | null;
	if (!context) {
		throw new Error("useChart must be used within ChartContext");
	}

	const { hoveredPoint, isolatedPoints, activeSeries, ...rest } = context;
	return {
		...rest,
		activeSeries,
		isHighlighted: (seriesId: string) => activeSeries === seriesId,
		isMuted: (seriesId: string) => activeSeries && activeSeries !== seriesId,
		isPointHovered: (point: InteractivePoint) => isEqual(point, hoveredPoint),
		isPointIsolated: ({ seriesId, x }: InteractivePoint) =>
			isolatedPoints[seriesId]?.has(toYyyyMm(x)) ?? false,
	};
}
