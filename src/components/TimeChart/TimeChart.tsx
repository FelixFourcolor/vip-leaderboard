import { type FC, type JSX, useMemo, useState } from "react";
import { windowed } from "@/utils/array";
import { monthsInRange, type YyyyMm } from "@/utils/time";
import { Chart, type ChartContainerProps, type NivoSeries } from "./Chart";
import { category10 } from "./colors";
import { ChartContext } from "./context";
import {
	Legend,
	type LegendContainerProps,
	type LegendEntryProps,
	type VisibleIdx,
} from "./Legend";
import type { InteractivePoint } from "./layers/Interaction";
import type { PointTooltipProps } from "./layers/Points";

export type ChartSeries = { id: string; data: readonly ChartPoint[] };
export type ChartPoint = { x: YyyyMm; y: number | null };

type Props<S extends ChartSeries> = {
	data: S[];
	colors?: readonly string[];
	yAxisTitle: string;
	since: YyyyMm;
	until: YyyyMm;
	stacked?: boolean;
	cumulative?: boolean;
	PointTooltip?: (props: PointTooltipProps<S>) => JSX.Element | null;
	Container?: FC<ChartContainerProps>;
	legend?: {
		Container?: FC<LegendContainerProps>;
		Entry: FC<LegendEntryProps<S>>;
	};
};

export function TimeChart<S extends ChartSeries>({
	data,
	yAxisTitle,
	since,
	until,
	colors = category10,
	stacked = false,
	cumulative = false,
	PointTooltip,
	Container,
	legend,
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
			<Chart
				data={useNivoSeries(chartData, stacked)}
				yAxisTitle={yAxisTitle}
				Container={Container}
			/>
			{legend && <Legend data={data} {...legend} />}
		</ChartContext.Provider>
	);
}

function useFilter<S extends ChartSeries>(
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
function useTransform<S extends ChartSeries>(
	filteredData: S[],
	xValues: YyyyMm[],
	{ stacked, cumulative }: TransformOptions,
): S[] {
	type Accumulator = { data: ChartPoint[]; sum: number };

	const transformedData = useMemo<ChartSeries[]>(() => {
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

function useColors(data: ChartSeries[], colors: readonly string[]) {
	return useMemo(() => {
		return Object.fromEntries(
			data.map(({ id }, index) => [id, colors[index % colors.length]!]),
		);
	}, [data, colors]);
}

const useIsolatedPoints = (data: ChartSeries[]) =>
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

function useNivoSeries(
	chartData: ChartSeries[],
	stacked: boolean,
): NivoSeries[] {
	const nivoData = useMemo(() => {
		return chartData.map(({ id, data }) => ({
			id: String(id),
			data: data.map(({ x, y }) => ({ x: new Date(x), y })),
		}));
	}, [chartData]);

	const sortedData = useMemo(() => {
		if (!stacked) {
			return nivoData;
		}
		// to draw higher-ranked series above (idk why nivo does it reversed)
		return [...nivoData].reverse();
	}, [nivoData, stacked]);

	return sortedData;
}
