import {
	type Point,
	type PointOrSliceMouseHandler,
	ResponsiveLine,
} from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RankingData } from "@/db/ranking";
import { getAnyValue } from "@/utils/object";
import { toDate } from "@/utils/time";
import styles from "./Chart.module.css";
import { ChartControls, useChartControls } from "./Controls";
import { useChartColors } from "./colors";
import configs from "./configs";
import { useChart } from "./context";
import { ChartLegend } from "./Legend";
import { ChartProvider } from "./Provider";

const cx = classNames.bind(styles);

const Chart = ({ entries }: { entries: RankingData }) => {
	const { chartData } = useChart();
	const xLabels = useMemo(() => {
		// all series have the same x values
		const data = getAnyValue(chartData);
		if (!data) {
			return [];
		}
		return data.monthlyCount.map(({ month }) => month);
	}, [chartData]);
	const { ref, gridXValues, axisBottom } = useLabelsSpacing(xLabels);

	const { onMouseMove, onMouseLeave } = useInteractive();

	return (
		<div className={cx("container")}>
			<div ref={ref} className={cx("chart")} onMouseLeave={onMouseLeave}>
				<ResponsiveLine
					data={useSeriesData()}
					colors={useChartColors()}
					pointLabel={usePointLabel(xLabels)}
					onMouseMove={onMouseMove}
					gridXValues={gridXValues}
					axisBottom={axisBottom}
					{...configs}
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

	const data = useMemo(() => {
		return mapValues(chartData, ({ monthlyCount }) => {
			return monthlyCount.map(({ month, count }) => ({
				x: new Date(month),
				y: count,
			}));
		});
	}, [chartData]);

	const sortedData = useMemo<ChartSeries[]>(() => {
		const sorted = (() => {
			if (!highlightedUser) {
				return data;
			}
			const { [highlightedUser]: highlighted, ...rest } = data;
			if (!highlighted) {
				return data;
			}
			return { [highlightedUser]: highlighted, ...rest };
		})();
		return Object.entries(sorted).map(([id, data]) => ({ id, data }));
	}, [data, highlightedUser]);

	return sortedData;
}

function useInteractive() {
	const { setHoveredPoint, setHighlightedUser } = useChart();

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

function usePointLabel(xLabels: string[]) {
	const [{ cumulative }] = useChartControls();
	const { chartData, highlightedUser, isolatedPoints } = useChart();

	const pointsCount = useMemo(() => {
		return mapValues(chartData, ({ monthlyCount }) => {
			return monthlyCount.filter(({ count }) => count !== null).length;
		});
	}, [chartData]);

	const labelsCount = cumulative ? 10 : 20;
	const labelInterval = Math.ceil(xLabels.length / labelsCount);

	return ({ seriesId, indexInSeries, data: { x, y } }: Point<ChartSeries>) => {
		if (highlightedUser !== seriesId || y === null) {
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
function useLabelsSpacing(xLabels: string[]) {
	const ref = useRef<HTMLDivElement | null>(null);
	const [width, setWidth] = useState(0);

	useEffect(() => {
		const chart = ref.current;
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

	const [gridXValues, axisBottom] = useMemo(() => {
		const count = xLabels.length;
		const innerWidth = Math.max(0, width - marginLeft - marginRight);
		const maxLabels = Math.max(2, Math.floor(innerWidth / labelWidth));
		const interval = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));

		const tickValues = xLabels
			.filter((_, index) => (count - 1 - index) % interval === 0)
			.map(toDate);
		const axisBottom = { format: "%Y-%m", tickValues };

		return [tickValues, axisBottom];
	}, [xLabels, width]);

	return { ref, gridXValues, axisBottom };
}
