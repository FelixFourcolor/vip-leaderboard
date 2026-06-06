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
import { fromEntries } from "@/utils/object";
import { monthsInRange, toYyyyMm, type YyyyMm } from "@/utils/time";
import type { Maybe } from "@/utils/types";
import type { ChartPoint, ChartSeries } from "./Chart";
import { category10 } from "./colors";
import { ChartContext } from "./context";
import type { VisibleIdx } from "./Legend";
import type { InteractivePoint } from "./layers/Interaction";
import type { PointTooltipProps } from "./layers/Points";

export type TimePoint = {
	month: YyyyMm;
	value: number;
};
export type TimeSeries = {
	id: string;
	data: readonly TimePoint[];
};

interface Props<S extends TimeSeries> extends TransformOptions {
	data: Maybe<readonly S[]>;
	since: YyyyMm;
	until: YyyyMm;
	colors?: readonly string[];
	/** Delay ms before rendering the chart. Helps with perceived performance. */
	renderDelay?: number;
	PointTooltip?: (props: PointTooltipProps<S>) => JSX.Element | null;
	children: ReactNode;
}

export function ChartWrapper<S extends TimeSeries>({
	data,
	since,
	until,
	colors = category10,
	stacked = false,
	cumulative = false,
	bump = false,
	renderDelay,
	PointTooltip,
	children,
}: Props<S>) {
	const [visibleIdx, setVisibleIdx] = useState<VisibleIdx>();
	const [activeSeries, setActiveSeries] = useState<string>();
	const [hoveredPoint, setHoveredPoint] = useState<InteractivePoint>();

	const xValues = useMemo(() => monthsInRange(since, until), [since, until]);
	const transformedData = useTransform(data, xValues, {
		stacked,
		cumulative,
		bump,
	});
	const isolatedPoints = useIsolatedPoints(transformedData);
	const chartData = useFilter(transformedData, visibleIdx);

	// Sync activeSeries, hoveredPoint, and visibleIdx
	const visibleIds = useMemo(
		() => new Set(chartData?.map(({ id }) => id)),
		[chartData],
	);
	const prevActiveSeries = useRef(activeSeries);
	useEffect(() => {
		if (activeSeries) {
			// inactivate series if it becomes invisible
			if (!visibleIds.has(activeSeries)) {
				setActiveSeries(undefined);
				prevActiveSeries.current = activeSeries;
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

	const renderReady = useDelay(renderDelay);
	return (
		<ChartContext
			value={{
				seriesData: renderReady ? data : undefined,
				chartData: renderReady ? chartData : undefined,
				xValues,
				colors,
				stacked,
				cumulative,
				bump,
				PointTooltip,
				isolatedPoints,
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

function useFilter(
	data: Maybe<readonly ChartSeries[]>,
	visibleIdx: Maybe<VisibleIdx>,
): Maybe<readonly ChartSeries[]> {
	return useMemo(() => {
		return visibleIdx
			? data?.filter((_, i) => visibleIdx.from <= i && i <= visibleIdx.to)
			: data;
	}, [data, visibleIdx]);
}

export interface TransformOptions {
	stacked?: boolean;
	bump?: boolean;
	cumulative?: boolean;
}
function useTransform(
	data: Maybe<readonly TimeSeries[]>,
	xValues: YyyyMm[],
	{ stacked, bump, cumulative }: Required<TransformOptions>,
): Maybe<readonly ChartSeries[]> {
	type Accumulator = { data: ChartPoint[]; sum: number };

	const transformedData = useMemo(() => {
		return data?.map(({ id, data: points }) => {
			const yValues = fromEntries(
				points.map(({ month, value }) => [month, value]),
			);

			if (!cumulative) {
				const data = xValues.map((month) => ({
					x: new Date(month),
					y: yValues[month] ?? (stacked ? 0 : null),
				}));
				return { id, data };
			}

			if (stacked) {
				// apply cumulative, all nulls become 0
				const { data } = xValues.reduce<Accumulator>(
					({ data, sum }, month) => {
						const y = yValues[month] ?? 0;
						sum += y;
						data.push({ x: new Date(month), y: sum });
						return { data, sum };
					},
					{ data: [], sum: 0 },
				);
				return { id, data };
			}

			// only interpolate points between the first and last non-null values
			const firstNonNull = xValues.findIndex((x) => yValues[x]);
			const lastNonNull = bump
				? xValues.length
				: xValues.findLastIndex((x) => yValues[x]);
			const continuousPoints = xValues.map((month, index) => {
				const x = new Date(month);
				if (firstNonNull <= index && index <= lastNonNull) {
					return { x, y: yValues[month] ?? 0 };
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
			return { id, data };
		});
	}, [data, xValues, stacked, bump, cumulative]);

	return useMemo(() => {
		if (!transformedData || !bump) {
			return transformedData;
		}
		const monthlyRanks = Array.from({ length: xValues.length }, (_, i) =>
			fromEntries(
				transformedData
					.map(({ id, data }) => {
						const y = data[i]?.y;
						return { id, y: y ?? 0, isNull: !y };
					})
					.sort((a, b) => b.y - a.y)
					.map(({ id, isNull }, index) => [id, isNull ? null : index + 1]),
			),
		);
		return transformedData.map(({ id, data, ...series }) => ({
			...series,
			id,
			data: data.map(({ x }, i) => ({
				x,
				y: monthlyRanks[i]?.[id] ?? null,
			})),
		}));
	}, [transformedData, bump, xValues.length]);
}

const useIsolatedPoints = (data: readonly ChartSeries[] = []) =>
	useMemo(() => {
		return Object.fromEntries(
			data.map(({ id, data }) => {
				const isolatedXValues = new Set(
					windowed(data, 3)
						.filter(([prev, curr, next]) => {
							return prev?.y == null && curr.y != null && next?.y == null;
						})
						.map(([, { x }]) => toYyyyMm(x)),
				);
				return [id, isolatedXValues];
			}),
		);
	}, [data]);
