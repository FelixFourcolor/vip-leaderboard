import { ResponsiveLine } from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { MonthlyRanking } from "@/db/monthlyRanking";
import type { RankingData } from "@/db/ranking";
import { getAnyValue } from "@/utils/object";
import { toDate } from "@/utils/time";
import styles from "./Chart.module.css";
import { ChartControls, useChartControls } from "./Controls";
import { getSeriesColor } from "./colors";
import configs from "./configs";
import { useChart } from "./context";
import { ChartLegend } from "./Legend";
import { ChartProvider } from "./Provider";

const cx = classNames.bind(styles);

const Chart = ({ entries }: { entries: RankingData }) => {
	const { chartData } = useChart();
	const xLabels = useMemo(() => {
		const userData = getAnyValue(chartData); // all series have the same x values
		if (!userData) {
			return [];
		}
		return userData.monthlyCount.map(({ month }) => month);
	}, [chartData]);

	const { chartRef, gridXValues, axisBottom } = useHorizontalScale(xLabels);
	const { yScale, axisLeft, gridYValues } = useVerticalScale();
	const data = useSeriesData();
	const colors = useColors();

	return (
		<div className={cx("container")}>
			<div ref={chartRef} className={cx("chart")}>
				{data.length > 0 ? (
					<ResponsiveLine
						{...configs}
						data={data}
						colors={colors}
						gridXValues={gridXValues}
						axisBottom={axisBottom}
						yScale={yScale}
						axisLeft={axisLeft}
						gridYValues={gridYValues}
					/>
				) : (
					<LoadingSpinner size={48} />
				)}
			</div>
			<ChartLegend entries={entries} />
			<ChartControls />
		</div>
	);
};

export default () => <ChartProvider>{Chart}</ChartProvider>;

export type ChartDataPoint = { x: Date; y: number | null };
export type ChartSeries = { id: string; data: ChartDataPoint[] };

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
				.reverse(); //  higher ranked users are drawn above
		}
		// highlighted user is drawn on top
		return Object.entries(
			(() => {
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

function useColors() {
	const { chartData, isMuted, isHighlighted } = useChart();

	const colorById = useMemo(() => {
		return mapValues(chartData, (user) => {
			const color = getSeriesColor(user);

			if (isHighlighted(user.id)) {
				return color;
			}

			if (isMuted(user.id)) {
				return `rgb(from ${color} r g b / 0.45)`;
			}

			return `rgb(from ${color} r g b / 0.85)`;
		});
	}, [chartData, isMuted, isHighlighted]);

	return ({ id }: { id: string }) => colorById[id]!;
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

function findMaxClamped(
	chartData: MonthlyRanking,
	stacked: boolean,
	threshold: number,
) {
	function whenStacked() {
		let max = 0;
		const seriesLength = getAnyValue(chartData)?.monthlyCount.length ?? 0;
		for (let i = 0; i < seriesLength; ++i) {
			const count = Object.values(chartData)
				.map(({ monthlyCount }) => monthlyCount[i]?.count ?? 0)
				.reduce((acc, n) => acc + n, 0);
			if (count >= threshold) {
				return threshold;
			}
			if (count > max) {
				max = count;
			}
		}
		return max;
	}

	function whenNotStacked() {
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

	return stacked ? whenStacked() : whenNotStacked();
}
function useVerticalScale() {
	const { chartData } = useChart();
	const [{ stacked }] = useChartControls();

	return useMemo(() => {
		const maxData = findMaxClamped(chartData, stacked, 8);
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
