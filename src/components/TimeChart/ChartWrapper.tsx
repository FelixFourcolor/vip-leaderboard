import { zip } from "es-toolkit";
import { type JSX, type ReactNode, useEffect, useMemo, useState } from "react";
import { useDelay } from "@/hooks/useDelay";
import { mapReduce } from "@/utils/array";
import { fromEntries, keys } from "@/utils/object";
import { monthsInRange, type YyyyMm } from "@/utils/time";
import type { Maybe } from "@/utils/types";
import type { ChartPoint, ChartSeries } from "./Chart";
import { ChartContext } from "./chartContext";
import { category10 } from "./colors";
import type { InteractivePoint } from "./layers/Interaction";
import type { PointTooltipProps } from "./layers/Points";
import { ZoomProvider } from "./ZoomProvider";

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
	PointTooltip?: (props: PointTooltipProps<S>) => JSX.Element | null;
	children: ReactNode;
}

export function ChartWrapper<S extends TimeSeries>({
	data,
	since,
	until,
	colors = category10,
	area = false,
	cumulative = false,
	ranked = false,
	PointTooltip,
	children,
}: Props<S>) {
	const [activeSeries, setActiveSeries] = useState<string>();
	const [hoveredPoint, setHoveredPoint] = useState<InteractivePoint>();
	const [enableHover, setEnableHover] = useState(true);

	const xValues = useMemo(() => monthsInRange(since, until), [since, until]);
	const transformedData = useTransform(data, xValues, {
		area,
		cumulative,
		ranked,
	});

	const [visibleIdx = [], setVisibleIdx] =
		useState<[from: number, to: number]>();
	const chartData = useMemo(
		() => transformedData?.slice(...visibleIdx),
		[transformedData, visibleIdx],
	);

	const visibleIds = useMemo(
		() => new Set(chartData?.map((s) => s.id)),
		[chartData],
	);
	// Mobile-specific handling
	useEffect(() => {
		const timeout = setTimeout(
			() => {
				if (!activeSeries) {
					return;
				}
				// on mobile, it's possible to scroll the legend while a series is still focused,
				// so, inactivate the series if it's no longer visible
				if (!visibleIds.has(activeSeries)) {
					setActiveSeries(undefined);
				}
				// similarly, reset hovered point
				if (hoveredPoint && hoveredPoint.seriesId !== activeSeries) {
					setHoveredPoint(undefined);
				}
			},
			0, // legend auto-scrolls to the active series when changed externally,
			// delay to avoid conflict
		);
		return () => clearTimeout(timeout);
	}, [visibleIds, activeSeries, hoveredPoint]);

	return (
		<ChartContext
			value={{
				seriesData: data,
				chartData,
				setVisibleIdx,
				renderReady: useDelay(),
				colors,
				since,
				until,
				area,
				cumulative,
				ranked,
				PointTooltip,
				activeSeries,
				setActiveSeries,
				hoveredPoint,
				setHoveredPoint,
				enableHover,
				setEnableHover,
			}}
		>
			<ZoomProvider>{children}</ZoomProvider>
		</ChartContext>
	);
}

export interface TransformOptions {
	area?: boolean;
	ranked?: boolean;
	cumulative?: boolean;
}
function useTransform(
	data: Maybe<readonly TimeSeries[]>,
	xValues: YyyyMm[],
	{ area, ranked, cumulative }: Required<TransformOptions>,
): Maybe<readonly ChartSeries[]> {
	type Accumulator = { data: ChartPoint[]; sum: number };

	const interpolatedData = useMemo<Maybe<readonly ChartSeries[]>>(() => {
		return data?.map(({ id, data: points }) => {
			const yValues = fromEntries(
				points.map(({ month, value }) => [month, value]),
			);

			if (!cumulative) {
				const data = xValues.map((month) => {
					const x = new Date(month);
					const y = yValues[month] ?? null;
					return { x, y, value: y ?? 0 };
				});
				return { id, data };
			}

			if (area) {
				// apply cumulative, all nulls become 0
				const { data } = xValues.reduce<Accumulator>(
					({ data, sum }, month) => {
						const y = yValues[month] ?? 0;
						sum += y;
						data.push({ x: new Date(month), y: sum, value: sum });
						return { data, sum };
					},
					{ data: [], sum: 0 },
				);
				return { id, data };
			}

			// only interpolate points between the first and last non-null values
			const firstNonNull = xValues.findIndex((x) => yValues[x]);
			const lastNonNull = ranked
				? xValues.length
				: xValues.findLastIndex((x) => yValues[x]);
			const continuousPoints = xValues.map((month, index) => {
				const x = new Date(month);
				if (firstNonNull <= index && index <= lastNonNull) {
					const y = yValues[month] ?? 0;
					return { x, y, value: y };
				}
				return { x, y: null, value: 0 };
			});
			const { data } = continuousPoints.reduce<Accumulator>(
				({ data, sum }, { x, y }) => {
					if (y !== null) {
						sum += y;
						data.push({ x, y: sum, value: sum });
					} else {
						data.push({ x, y: null, value: 0 });
					}
					return { data, sum };
				},
				{ data: [], sum: 0 },
			);
			return { id, data };
		});
	}, [data, xValues, area, ranked, cumulative]);

	const stackedData = useMemo<Maybe<readonly ChartSeries[]>>(() => {
		if (!interpolatedData || !area || ranked) {
			return undefined;
		}
		return mapReduce(
			interpolatedData.toReversed(),
			({ data: prevData }, { id, data }) => ({
				id,
				data: zip(prevData, data).map(([{ y: prevY }, { x, value }]) => ({
					x,
					y: prevY + value,
					value,
				})),
			}),
			{ data: Array.from({ length: xValues.length }, () => ({ y: 0 })) },
		).reverse();
	}, [interpolatedData, area, ranked, xValues.length]);

	const monthlyRankings = useMemo(() => {
		if (!interpolatedData || !ranked) {
			return undefined;
		}
		return Array.from({ length: xValues.length }, (_, i) =>
			fromEntries(
				interpolatedData
					.map(({ id, data }, index) => ({ id, index, value: data[i]!.value }))
					.sort((a, b) => b.value - a.value || a.index - b.index)
					.map(({ id, value }, index) => [id, !value ? undefined : index + 1]),
			),
		);
	}, [interpolatedData, ranked, xValues.length]);

	const rankedData = useMemo(() => {
		if (!interpolatedData || !monthlyRankings) {
			return undefined;
		}

		if (!area) {
			return interpolatedData.map(({ id, data }) => ({
				id,
				data: data.map(({ x, y }, i) => {
					const rank = monthlyRankings[i]?.[id];
					return { x, y: rank ?? null, value: y ?? 0, rank };
				}),
			}));
		}

		const dataById = fromEntries(
			interpolatedData.map(({ id, data }) => [id, data]),
		);
		const newDataById: typeof dataById = fromEntries(
			interpolatedData.map(({ id }) => [id, []]),
		);
		monthlyRankings.forEach((month, monthIdx) => {
			const seriesSortedAsc = keys(month).reverse();
			let prevY = 0;
			seriesSortedAsc.forEach((id, seriesIdx) => {
				const { x, y } = dataById[id]![monthIdx]!;
				const value = y ?? 0;
				prevY += value;
				newDataById[id]!.push({
					x,
					y: prevY,
					value,
					rank: seriesSortedAsc.length - seriesIdx,
				});
			});
		});
		return Object.entries(newDataById).map(([id, data]) => ({ id, data }));
	}, [interpolatedData, area, monthlyRankings]);

	return ranked ? rankedData : area ? stackedData : interpolatedData;
}
