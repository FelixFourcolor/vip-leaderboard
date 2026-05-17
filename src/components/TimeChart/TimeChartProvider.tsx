import { type JSX, type ReactNode, useMemo, useState } from "react";
import { windowed } from "@/utils/array";
import { monthsInRange, type YyyyMm } from "@/utils/time";
import { category10 } from "./colors";
import { ChartContext } from "./context";
import type { VisibleIdx } from "./Legend";
import type { InteractivePoint } from "./layers/Interaction";
import type { PointTooltipProps } from "./layers/Points";

export type TimeSeries = { id: string; data: readonly TimePoint[] };
export type TimePoint = { x: YyyyMm; y: number | null };

type Props<S extends TimeSeries> = {
	data: S[];
	since: YyyyMm;
	until: YyyyMm;
	stacked?: boolean;
	cumulative?: boolean;
	colors?: readonly string[];
	PointTooltip?: (props: PointTooltipProps<S>) => JSX.Element | null;
	children: ReactNode;
};

export function TimeChartContext<S extends TimeSeries>({
	data,
	since,
	until,
	colors = category10,
	stacked = false,
	cumulative = false,
	PointTooltip,
	children,
}: Props<S>) {
	const [visibleIdx, setVisibleIdx] = useState<VisibleIdx>();
	const [highlightedSeries, setHighlightedSeries] = useState<string>();
	const [hoveredPoint, setHoveredPoint] = useState<InteractivePoint>();

	const visibleData = useFilter(data, visibleIdx);
	const xValues = useMemo(() => monthsInRange(since, until), [since, until]);
	const chartData = useTransform(visibleData, xValues, { stacked, cumulative });

	return (
		<ChartContext.Provider
			value={{
				data,
				chartData,
				xValues,
				colors: useColors(data, colors),
				stacked,
				cumulative,
				PointTooltip: PointTooltip as any, // generics
				isolatedPoints: useIsolatedPoints(chartData),
				highlightedSeries,
				setHighlightedSeries,
				hoveredPoint,
				setHoveredPoint,
				visibleIdx,
				setVisibleIdx,
			}}
		>
			{children}
		</ChartContext.Provider>
	);
}

function useFilter<S extends TimeSeries>(
	data: S[],
	visibleIdx: VisibleIdx | undefined,
): S[] {
	return useMemo(() => {
		return visibleIdx
			? data.filter((_, i) => visibleIdx.from <= i && i <= visibleIdx.to)
			: data;
	}, [data, visibleIdx]);
}

type TransformOptions = { stacked: boolean; cumulative: boolean };
function useTransform<S extends TimeSeries>(
	filteredData: S[],
	xValues: YyyyMm[],
	{ stacked, cumulative }: TransformOptions,
): S[] {
	type Accumulator = { data: TimePoint[]; sum: number };

	const transformedData = useMemo<TimeSeries[]>(() => {
		return filteredData.map(({ data: points, ...rest }) => {
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
				// to keep the graph clean
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

	return transformedData as S[];
}

function useColors(data: TimeSeries[], colors: readonly string[]) {
	return useMemo(() => {
		return Object.fromEntries(
			data.map(({ id }, index) => [id, colors[index % colors.length]!]),
		);
	}, [data, colors]);
}

const useIsolatedPoints = (data: TimeSeries[]) =>
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
