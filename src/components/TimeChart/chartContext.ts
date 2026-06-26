import { isEqual } from "es-toolkit";
import {
	createContext,
	type Dispatch,
	type ReactElement,
	type SetStateAction,
	use,
} from "react";
import type { YyyyMm } from "@/utils/time";
import type { Maybe, State } from "@/utils/types";
import type { ChartSeries } from "./Chart";
import type { TimeSeries } from "./ChartWrapper";
import type { InteractivePoint } from "./layers/Interaction";
import type { PointTooltipProps } from "./layers/Points";

interface ChartContextValue<S extends TimeSeries = TimeSeries>
	extends State<{
		activeSeries: Maybe<string>;
		hoveredPoint: Maybe<InteractivePoint>;
		enableHover: boolean;
	}> {
	seriesData: Maybe<readonly S[]>;
	chartData: Maybe<readonly ChartSeries[]>;
	setVisibleIdx: Dispatch<SetStateAction<Maybe<[from: number, to: number]>>>;
	renderReady: boolean;
	since: YyyyMm;
	until: YyyyMm;
	area: boolean;
	cumulative: boolean;
	ranked: boolean;
	colors: readonly string[];
	PointTooltip: Maybe<(props: PointTooltipProps<S>) => ReactElement | null>;
}

export const ChartContext = createContext<ChartContextValue<any> | null>(null);

export function useChart<S extends TimeSeries = TimeSeries>() {
	const context = use(ChartContext) as ChartContextValue<S> | null;
	if (!context) {
		throw new Error("useChart must be used within ChartContext");
	}

	const { hoveredPoint, activeSeries, ...rest } = context;
	return {
		...rest,
		activeSeries,
		isHighlighted: (seriesId: string) => activeSeries === seriesId,
		isMuted: (seriesId: string) => activeSeries && activeSeries !== seriesId,
		isPointHovered: (point: InteractivePoint) => isEqual(point, hoveredPoint),
	};
}
