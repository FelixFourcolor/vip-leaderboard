import { type FC, type JSX, useMemo, useState } from "react";
import { windowed } from "@/utils/array";
import { monthsInRange, type YyyyMm } from "@/utils/time";
import { Chart, type ChartRendererProps, type NivoSeries } from "./Chart";
import { category10 } from "./colors";
import { ChartContext } from "./context";
import {
	Legend,
	type LegendEntryProps,
	type LegendRendererProps,
	type VisibleIndices,
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
	PointTooltip?: (props: PointTooltipProps<ChartSeries>) => JSX.Element | null;
	Renderer?: FC<ChartRendererProps>;
	legend?: {
		Renderer?: FC<LegendRendererProps>;
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
	Renderer,
	legend,
}: Props<S>) {
	const [visibleIndices, setVisibleIndices] = useState<VisibleIndices>();

	const [highlightedSeries, setHighlightedSeries] = useState<string>();

	const [hoveredPoint, setHoveredPoint] = useState<InteractivePoint>();

	const xValues = useMemo(() => monthsInRange(since, until), [since, until]);

	const chartData = useTransform(data, xValues, {
		stacked,
		cumulative,
		visibleIndices,
	});

	return (
		<ChartContext.Provider
			value={{
				chartData,
				xValues,
				colors: useColors(data, colors),
				stacked,
				cumulative,
				PointTooltip,
				isolatedPoints: useIsolatedPoints(chartData),
				highlightedSeries,
				setHighlightedSeries,
				hoveredPoint,
				setHoveredPoint,
				visibleIndices,
				setVisibleIndices,
			}}
		>
			<Chart
				data={useNivoSeries(chartData, stacked)}
				yAxisTitle={yAxisTitle}
				Renderer={Renderer}
			/>
			{legend && <Legend data={data} {...legend} />}
		</ChartContext.Provider>
	);
}

type TransformOptions = {
	stacked: boolean;
	cumulative: boolean;
	visibleIndices: VisibleIndices | undefined;
};
function useTransform<S extends ChartSeries>(
	data: S[],
	xValues: YyyyMm[],
	{ stacked, cumulative, visibleIndices }: TransformOptions,
): S[] {
	const filteredData = useMemo(
		() =>
			visibleIndices
				? data.filter(
						(_, i) => visibleIndices.from <= i && i <= visibleIndices.to,
					)
				: data,
		[data, visibleIndices],
	);

	type Accumulator = { data: ChartPoint[]; sum: number };

	const transformedData = useMemo<ChartSeries[]>(
		() =>
			filteredData.map(({ data: points, ...rest }) => {
				const pointMapping = Object.fromEntries(
					points.map(({ x, y }) => [x, y]),
				);

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
			}),
		[filteredData, xValues, stacked, cumulative],
	);

	return transformedData as S[];
}

function useColors(data: ChartSeries[], colors: readonly string[]) {
	return useMemo(() => {
		console.log("useColors");
		return Object.fromEntries(
			data.map(({ id }, index) => {
				const color = colors[index % colors.length]!;
				return [id, color];
			}),
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
