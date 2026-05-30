import {
	type JSX,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useDelay } from "@/hooks/useDelay";
import { windowed } from "@/utils/array";
import { monthsInRange, type YyyyMm } from "@/utils/time";
import { category10 } from "./colors";
import { ChartContext } from "./context";
import type { VisibleIdx } from "./Legend";
import type { InteractivePoint } from "./layers/Interaction";
import type { PointTooltipProps } from "./layers/Points";

export type TimePoint = {
	x: YyyyMm;
	y: number | null;
};
export type TimeSeries = {
	id: string;
	data: readonly TimePoint[];
};

type Props<S extends TimeSeries> = {
	data: S[] | undefined;
	since: YyyyMm;
	until: YyyyMm;
	stacked?: boolean;
	cumulative?: boolean;
	colors?: readonly string[];
	/** Delay ms before rendering the chart. Helps with perceived performance. */
	renderDelay?: number;
	PointTooltip?: (props: PointTooltipProps<S>) => JSX.Element | null;
	children: ReactNode;
};

export function ChartWrapper<S extends TimeSeries>({
	data,
	since,
	until,
	colors = category10,
	stacked = false,
	cumulative = false,
	renderDelay,
	PointTooltip,
	children,
}: Props<S>) {
	const [visibleIdx, setVisibleIdx] = useState<VisibleIdx>();
	const [activeSeries, setActiveSeries] = useState<string>();
	const [hoveredPoint, setHoveredPoint] = useState<InteractivePoint>();

	const visibleData = useFilter(data, visibleIdx);
	const xValues = useMemo(() => monthsInRange(since, until), [since, until]);
	const chartData = useTransform(visibleData, xValues, { stacked, cumulative });

	const visibleIds = useMemo(
		() => new Set(visibleData?.map(({ id }) => id)),
		[visibleData],
	);
	// A bunch of badly written glue code to
	// sync activeSeries, hoveredPoint and visibleIdx.
	// If something breaks, it's probbably here.
	const prevActiveSeries = useRef(activeSeries);
	useEffect(() => {
		if (activeSeries) {
			// inactivate series if it becomes invisible
			if (!visibleIds.has(activeSeries)) {
				setActiveSeries(undefined);
				prevActiveSeries.current = undefined;
			}
			// hide tooltip if hovered point doesn't belong to active series anymore
			else if (hoveredPoint && hoveredPoint.seriesId !== activeSeries) {
				setHoveredPoint(undefined);
			}
		}
		// recover the active series if it becomes visible again
		else if (
			prevActiveSeries.current &&
			prevActiveSeries.current === hoveredPoint?.seriesId &&
			visibleIds.has(hoveredPoint.seriesId)
		) {
			setActiveSeries(hoveredPoint.seriesId);
		}
	}, [visibleIds, activeSeries, hoveredPoint]);

	const renderReady = useDelay(renderDelay) || renderDelay === undefined;
	return (
		<ChartContext
			value={{
				chartSeries: renderReady ? data : undefined,
				chartData: renderReady ? chartData : undefined,
				xValues,
				colorMapping: useColorMapping(data, colors),
				stacked,
				cumulative,
				PointTooltip: PointTooltip as any, // generics
				isolatedPoints: useIsolatedPoints(chartData),
				activeSeries,
				setActiveSeries,
				hoveredPoint,
				setHoveredPoint,
				visibleIdx,
				setVisibleIdx,
			}}
		>
			{children}
		</ChartContext>
	);
}

function useFilter<S extends TimeSeries>(
	data: S[] | undefined,
	visibleIdx: VisibleIdx | undefined,
): S[] | undefined {
	return useMemo(() => {
		return data && visibleIdx
			? data.filter((_, i) => visibleIdx.from <= i && i <= visibleIdx.to)
			: data;
	}, [data, visibleIdx]);
}

type TransformOptions = { stacked: boolean; cumulative: boolean };
function useTransform<S extends TimeSeries>(
	filteredData: S[] | undefined,
	xValues: YyyyMm[],
	{ stacked, cumulative }: TransformOptions,
): S[] | undefined {
	type Accumulator = { data: TimePoint[]; sum: number };

	const transformedData = useMemo<TimeSeries[] | undefined>(() => {
		return filteredData?.map(({ data: points, ...rest }) => {
			const pointMapping = Object.fromEntries(points.map(({ x, y }) => [x, y]));

			if (!cumulative) {
				const data = xValues.map((x) => ({
					x,
					y: pointMapping[x] ?? (stacked ? 0 : null),
				}));
				return { ...rest, data };
			}

			if (stacked) {
				const { data } = xValues.reduce<Accumulator>(
					({ data, sum }, x) => {
						const y = pointMapping[x] ?? 0;
						sum += y;
						data.push({ x, y: sum });
						return { data, sum };
					},
					{ data: [], sum: 0 },
				);
				return { ...rest, data };
			}

			const firstNonNull = xValues.findIndex((x) => pointMapping[x]);
			const lastNonNull = xValues.findLastIndex((x) => pointMapping[x]);
			const continuousPoints = xValues.map((x, index) => {
				// Only interpolate the points between the first and last non-null values
				// to keep the Chart clean
				if (firstNonNull <= index && index <= lastNonNull) {
					return { x, y: pointMapping[x] ?? 0 };
				}
				return { x, y: null };
			});
			const { data } = continuousPoints.reduce<Accumulator>(
				({ data, sum }, { x, y }) => {
					if (y !== null) {
						sum += y;
						data.push({ x, y: sum });
					} else {
						data.push({ x, y: null });
					}
					return { data, sum };
				},
				{ data: [], sum: 0 },
			);
			return { ...rest, data };
		});
	}, [filteredData, xValues, stacked, cumulative]);

	return transformedData as S[] | undefined;
}

function useColorMapping(data: TimeSeries[] = [], colors: readonly string[]) {
	return useMemo(() => {
		return Object.fromEntries(
			data.map(({ id }, index) => [id, colors[index % colors.length]!]),
		);
	}, [data, colors]);
}

const useIsolatedPoints = (data: TimeSeries[] = []) =>
	useMemo(() => {
		return Object.fromEntries(
			data.map(({ id, data }) => {
				const isolatedXValues = new Set(
					windowed(data, 3)
						.filter(([prev, curr, next]) => {
							return prev?.y == null && curr.y != null && next?.y == null;
						})
						.map(([, { x }]) => x),
				);
				return [id, isolatedXValues];
			}),
		);
	}, [data]);
