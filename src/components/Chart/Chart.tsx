import {
	type Point,
	type PointOrSliceMouseHandler,
	ResponsiveLine,
} from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues, noop } from "es-toolkit";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MonthlyRanking } from "@/db/monthlyRanking";
import type { RankingData } from "@/db/ranking";
import { getAnyValue } from "@/utils/object";
import { toDate, toYyyyMm } from "@/utils/time";
import styles from "./Chart.module.css";
import { ChartControls, useChartControls } from "./Controls";
import configs from "./configs";
import { useChart } from "./context";
import { ChartLegend } from "./Legend";
import { ChartProvider } from "./Provider";

const cx = classNames.bind(styles);

const Chart = ({ entries }: { entries: RankingData }) => {
	const { chartData, colorById } = useChart();
	const [{ stacked }] = useChartControls();

	const xLabels = useMemo(() => {
		const data = getAnyValue(chartData); // all series have the same x values
		if (!data) {
			return [];
		}
		return data.monthlyCount.map(({ month }) => month);
	}, [chartData]);

	const { chartRef, gridXValues, axisBottom } = useHorizontalScale(xLabels);
	const { yScale, axisLeft, gridYValues } = useVerticalScale();
	const { onMouseMove, onMouseLeave } = useInteractive();

	return (
		<div className={cx("container")}>
			<div ref={chartRef} className={cx("chart")} onMouseLeave={onMouseLeave}>
				<ResponsiveLine
					{...configs}
					data={useSeriesData()}
					colors={({ id }) => colorById[id]!}
					pointLabel={usePointLabel(xLabels)}
					enableArea={stacked}
					onMouseMove={onMouseMove}
					gridXValues={gridXValues}
					axisBottom={axisBottom}
					yScale={yScale}
					axisLeft={axisLeft}
					gridYValues={gridYValues}
				/>
			</div>
			<ChartLegend entries={entries} />
			<ChartControls />
		</div>
	);
};

export default () => <ChartProvider>{Chart}</ChartProvider>;

export type ChartSeries = {
	id: string;
	data: { x: Date; y: number | null }[];
};

function useSeriesData() {
	const { chartData, highlightedUser } = useChart();
	const [{ stacked }] = useChartControls();

	const data = useMemo(() => {
		return mapValues(chartData, ({ monthlyCount }) => {
			return monthlyCount.map(({ month, count }) => ({
				x: new Date(month),
				y: count,
			}));
		});
	}, [chartData]);

	const sortedData = useMemo<ChartSeries[]>(() => {
		if (stacked) {
			return Object.entries(data)
				.map(([id, data]) => ({ id, data }))
				.reverse(); // so that higher ranked users are drawn on top
		}
		return Object.entries(
			(() => {
				// move highlighted user first so that it's drawn on top
				if (!highlightedUser) {
					return data;
				}
				const { [highlightedUser]: highlightedData, ...rest } = data;
				if (!highlightedData) {
					return data;
				}
				return { [highlightedUser]: highlightedData, ...rest };
			})(),
		).map(([id, data]) => ({ id, data }));
	}, [data, highlightedUser, stacked]);

	return sortedData;
}

function useInteractive() {
	const { setHoveredPoint, setHighlightedUser } = useChart();
	const [{ stacked }] = useChartControls();

	if (stacked) {
		// TODO: support tooltip for stacked mode
		// nivo's position calculation doesn't work for stacked mode, need to DIY
		return { onMouseMove: noop, onMouseLeave: noop };
	}

	const onMouseMove: PointOrSliceMouseHandler<ChartSeries> = (datum) => {
		if (!("seriesId" in datum)) {
			return;
		}
		const { seriesId, data } = datum;
		setHighlightedUser(seriesId);
		const { x, y } = data;
		if (y !== null) {
			setHoveredPoint({ x, y });
		}
	};

	const onMouseLeave = () => {
		setHighlightedUser(undefined);
		setHoveredPoint(undefined);
	};

	return { onMouseMove, onMouseLeave };
}

function usePointLabel(xLabels: readonly string[]) {
	const [{ cumulative }] = useChartControls();
	const { chartData, highlightedUser, isolatedPoints } = useChart();

	const pointsCount = useMemo(() => {
		return mapValues(chartData, ({ monthlyCount }) => {
			return monthlyCount.filter(({ count }) => count).length;
		});
	}, [chartData]);

	const labelsCount = cumulative ? 10 : 20;
	const labelInterval = Math.ceil(xLabels.length / labelsCount);

	return ({ seriesId, indexInSeries, data: { x, y } }: Point<ChartSeries>) => {
		if (highlightedUser !== seriesId || !y) {
			return "";
		}

		const count = pointsCount[seriesId] ?? xLabels.length;
		// reversed so that last point is always labeled (most recent = most important)
		const index = count - 1 - indexInSeries;
		if (
			index % labelInterval === 0 ||
			isolatedPoints[seriesId]?.has(toYyyyMm(x))
		) {
			return String(y);
		}

		return "";
	};
}

const fontSize = 12;
const gap = 12;
const labelWidth = 7 * fontSize * 0.6 + gap;
const { left: marginLeft, right: marginRight } = configs.margin;
function useHorizontalScale(xLabels: readonly string[]) {
	const chartRef = useRef<HTMLDivElement | null>(null);
	const [width, setWidth] = useState(0);

	useEffect(() => {
		const chart = chartRef.current;
		if (!chart) {
			return;
		}
		setWidth(chart.clientWidth);
		const observer = new ResizeObserver(
			([entry]) => entry && setWidth(entry.contentRect.width),
		);
		observer.observe(chart);
		return () => observer.disconnect();
	}, []);

	return useMemo(() => {
		const count = xLabels.length;
		const innerWidth = Math.max(0, width - marginLeft - marginRight);
		const maxLabels = Math.max(2, Math.floor(innerWidth / labelWidth));
		const interval = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));

		const tickValues = xLabels
			.filter((_, index) => (count - 1 - index) % interval === 0)
			.map(toDate);

		return {
			chartRef,
			xLabels,
			axisBottom: { ...configs.axisBottom, tickValues },
			gridXValues: tickValues,
		};
	}, [xLabels, width]);
}

function findMaxClamped(chartData: MonthlyRanking, threshold: number) {
	let max = 0;
	for (const { monthlyCount } of Object.values(chartData)) {
		for (const { count } of monthlyCount) {
			if (count == null) {
				continue;
			}
			if (count >= threshold) {
				return threshold;
			}
			if (count > max) {
				max = count;
			}
		}
	}
	return max;
}
function useVerticalScale() {
	const { chartData } = useChart();
	const [{ stacked }] = useChartControls();

	return useMemo(() => {
		const maxData = findMaxClamped(chartData, 8);
		const max = maxData >= 2 ? ("auto" as const) : 2;
		const tickValues =
			maxData >= 8
				? undefined
				: Array.from({ length: Math.max(2, maxData) + 1 }, (_, i) => i);

		return {
			yScale: { ...configs.yScale, max, stacked },
			axisLeft: { ...configs.axisLeft, tickValues },
			gridYValues: tickValues,
		};
	}, [chartData, stacked]);
}
