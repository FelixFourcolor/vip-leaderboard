import { createContext, type ReactElement, use, useCallback } from "react";
import { toYyyyMm, type YyyyMm } from "@/utils/time";
import type { Maybe, State } from "@/utils/types";
import type { VisibleIdx } from "./Legend";
import type { InteractivePoint } from "./layers/Interaction";
import type { PointTooltipProps } from "./layers/Points";
import type { TimeSeries } from "./TimeChartProvider";

interface ChartContextValue<S extends TimeSeries = TimeSeries>
	extends State<"focusedSeries", Maybe<string>>,
		State<"hoveredPoint", Maybe<InteractivePoint>>,
		State<"visibleIdx", Maybe<VisibleIdx>> {
	data: readonly S[] | undefined;
	chartData: readonly S[] | undefined;
	xValues: readonly YyyyMm[];
	stacked: boolean;
	cumulative: boolean;
	colorMapping: Record<string, string>;
	isolatedPoints: Record<string, Set<string>>;
	PointTooltip: Maybe<(props: PointTooltipProps<S>) => ReactElement | null>;
}

export const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart<S extends TimeSeries = TimeSeries>() {
	const context = use(ChartContext) as ChartContextValue<S> | null;
	if (!context) {
		throw new Error("useChart must be used within ChartContext");
	}

	const { hoveredPoint, isolatedPoints, focusedSeries, ...rest } = context;

	const isPointHovered = useCallback(
		(point: InteractivePoint) =>
			hoveredPoint?.seriesId === point.seriesId &&
			hoveredPoint?.x.getTime() === point.x.getTime(),
		[hoveredPoint],
	);

	const isPointIsolated = useCallback(
		(point: InteractivePoint) =>
			isolatedPoints[point.seriesId]?.has(toYyyyMm(point.x)),
		[isolatedPoints],
	);

	const isHighlighted = useCallback(
		(seriesId: string) => focusedSeries === seriesId,
		[focusedSeries],
	);

	const isMuted = useCallback(
		(seriesId: string) => focusedSeries && focusedSeries !== seriesId,
		[focusedSeries],
	);

	return {
		...rest,
		focusedSeries,
		isPointHovered,
		isPointIsolated,
		isHighlighted,
		isMuted,
	};
}
