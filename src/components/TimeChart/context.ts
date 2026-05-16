import { createContext, type ReactElement, use, useCallback } from "react";
import { toYyyyMm, type YyyyMm } from "@/utils/time";
import type { Maybe, State } from "@/utils/types";
import type { VisibleIdx } from "./Legend";
import type { InteractivePoint } from "./layers/Interaction";
import type { PointTooltipProps } from "./layers/Points";
import type { ChartSeries } from "./TimeChart";

type ChartContextValue<S extends ChartSeries = ChartSeries> = {
	chartData: S[];
	xValues: readonly YyyyMm[];
	stacked: boolean;
	cumulative: boolean;
	colors: Record<string, string>;
	isolatedPoints: Record<string, Set<string>>;
	PointTooltip: Maybe<(props: PointTooltipProps<S>) => ReactElement | null>;
} & State<"highlightedSeries", Maybe<string>> &
	State<"hoveredPoint", Maybe<InteractivePoint>> &
	State<"visibleIdx", Maybe<VisibleIdx>>;

export const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart<S extends ChartSeries = ChartSeries>() {
	const context = use(ChartContext) as ChartContextValue<S> | null;
	if (!context) {
		throw new Error("useChart must be used within ChartContext");
	}

	const { hoveredPoint, isolatedPoints, highlightedSeries, ...rest } = context;

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
		(seriesId: string) => highlightedSeries === seriesId,
		[highlightedSeries],
	);

	const isMuted = useCallback(
		(seriesId: string) => highlightedSeries && highlightedSeries !== seriesId,
		[highlightedSeries],
	);

	return {
		...rest,
		isPointHovered,
		isPointIsolated,
		isHighlighted,
		isMuted,
	};
}
