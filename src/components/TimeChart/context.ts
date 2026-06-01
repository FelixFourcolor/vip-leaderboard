import { createContext, type ReactElement, use } from "react";
import { toYyyyMm, type YyyyMm } from "@/utils/time";
import type { Maybe, State } from "@/utils/types";
import type { TimeSeries } from "./ChartWrapper";
import type { VisibleIdx } from "./Legend";
import type { InteractivePoint } from "./layers/Interaction";
import type { PointTooltipProps } from "./layers/Points";

interface ChartContextValue<S extends TimeSeries = TimeSeries>
	extends State<"activeSeries", Maybe<string>>,
		State<"hoveredPoint", Maybe<InteractivePoint>>,
		State<"visibleIdx", Maybe<VisibleIdx>> {
	chartSeries: readonly Omit<S, "data">[] | undefined;
	chartData: readonly S[] | undefined;
	xValues: readonly YyyyMm[];
	stacked: boolean;
	cumulative: boolean;
	colors: readonly string[];
	isolatedPoints: Record<string, Set<string>>;
	PointTooltip: Maybe<(props: PointTooltipProps<S>) => ReactElement | null>;
}

export const ChartContext = createContext<ChartContextValue | null>(null);

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
		isPointIsolated: ({ seriesId, x }: InteractivePoint) =>
			isolatedPoints[seriesId]?.has(toYyyyMm(x)),
		isPointHovered: ({ seriesId, x }: InteractivePoint) =>
			hoveredPoint?.seriesId === seriesId &&
			hoveredPoint.x.getTime() === x.getTime(),
	};
}
