import { ResponsiveLine } from "@nivo/line";
import classNames from "classnames/bind";
import { partition } from "es-toolkit";
import {
	type ComponentProps,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toDate } from "@/utils/time";
import type { Maybe } from "@/utils/types";
import { useChart } from "./context";
import { Areas } from "./layers/Areas";
import { Interaction } from "./layers/Interaction";
import { Labels } from "./layers/Labels";
import { Lines } from "./layers/Lines";
import { Points } from "./layers/Points";
import styles from "./TimeChart.module.css";

const cx = classNames.bind(styles);

export type ChartSeries = { id: string; data: ChartPoint[] };
export type ChartPoint = {
	x: Date;
	y: number | null;
	value: number;
	rank?: number;
};

type NivoProps = ComponentProps<typeof ResponsiveLine<ChartSeries>>;
type ChartProps = {
	margin?: NivoProps["margin"];
	axisLeft?: Pick<
		NonNullable<NivoProps["axisLeft"]>,
		"legendOffset" | "legend"
	>;
	className?: string;
};

export function Chart({ className, ...configs }: ChartProps) {
	const { renderReady } = useChart();
	const data = useDataOrdering();
	const colors = useColors();
	const { chartRef, gridXValues, axisBottom } = useHorizontalScale(configs);
	const { yScale, axisLeft, gridYValues } = useVerticalScale(configs);

	return (
		<div ref={chartRef} className={cx("chart", className)}>
			{renderReady && data ? (
				<ResponsiveLine
					{...DEFAULT_CONFIGS}
					margin={{ ...DEFAULT_CONFIGS.margin, ...configs.margin }}
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
	);
}

const DEFAULT_CONFIGS = {
	curve: "monotoneX",
	useMesh: false,
	enableCrosshair: false,
	xFormat: "time:%Y-%m",
	xScale: { type: "time", useUTC: false },
	yScale: { type: "linear" },
	axisBottom: { format: "%Y-%m" },
	margin: { top: 28, right: 28, bottom: 28, left: 28 },
	layers: ["grid", "axes", Areas, Lines, Points, Labels, Interaction],
	theme: {
		background: "var(--bg-secondary)",
		text: { fontFamily: "inherit" },
		axis: {
			ticks: {
				line: {
					stroke: "var(--text-tertiary)",
					strokeWidth: 0.5,
				},
				text: {
					fill: "var(--text-secondary)",
					fontSize: "var(--text-small)",
					fontWeight: "var(--weight-semi-bold)",
				},
			},
			legend: {
				text: {
					fill: "var(--text-primary)",
					fontSize: "var(--text-semi-large)",
				},
			},
		},
		grid: {
			line: {
				stroke: "var(--text-tertiary)",
				strokeWidth: 0.5,
			},
		},
	},
} satisfies Partial<ComponentProps<typeof ResponsiveLine<ChartSeries>>>;

function useDataOrdering(): Maybe<readonly ChartSeries[]> {
	const { chartData, activeSeries, area, ranked } = useChart();
	const stacked = area && !ranked;

	// To draw the active series on top
	// Except in stacked mode where the bands never overlap anyway
	return useMemo(() => {
		if (!chartData || !activeSeries || stacked) {
			return chartData;
		}
		const [active, others] = partition(chartData, (s) => s.id === activeSeries);
		return [...others, ...active];
	}, [chartData, activeSeries, stacked]);
}

function useColors() {
	const { seriesData, colors } = useChart();

	const colorMapping = useMemo(() => {
		if (!seriesData) {
			return {};
		}
		return Object.fromEntries(
			seriesData.map(({ id }, i) => [id, colors[i % colors.length]]),
		);
	}, [seriesData, colors]);

	// Cannot use array index because of useDataOrdering
	return (series: ChartSeries) => colorMapping[series.id]!;
}

const fontSize = 12;
const gap = 12;
const labelWidth = 7 * fontSize * 0.6 + gap;
function useHorizontalScale({
	margin: { left: marginLeft = 0, right: marginRight = 0 } = {},
}: ChartProps) {
	const { xValues } = useChart();

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
		const count = xValues.length;
		const innerWidth = Math.max(0, width - marginLeft - marginRight);
		const maxLabels = Math.max(2, Math.floor(innerWidth / labelWidth));
		const interval = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));

		const tickValues = xValues
			.filter((_, index) => (count - 1 - index) % interval === 0)
			.map(toDate);

		return {
			chartRef,
			xLabels: xValues,
			axisBottom: { ...DEFAULT_CONFIGS.axisBottom, tickValues },
			gridXValues: tickValues,
		};
	}, [marginLeft, marginRight, xValues, width]);
}

function useVerticalScale({ axisLeft }: ChartProps) {
	const { chartData = [], area, ranked } = useChart();

	const reverse = !area && ranked;
	const min = area ? 0 : 1;
	const max = useMemo(() => {
		const THRESHOLD = 8;
		let max = 0;
		for (const { data } of chartData) {
			for (const { y } of data) {
				if (y == null) {
					continue;
				}
				if (y >= THRESHOLD) {
					return THRESHOLD;
				}
				if (y > max) {
					max = y;
				}
			}
		}
		return max;
	}, [chartData]);

	if (max >= 8) {
		const yScale = { ...DEFAULT_CONFIGS.yScale, min, reverse };
		return { yScale, axisLeft };
	}

	const tickValues = Array.from({ length: max - min + 1 }, (_, i) => i + min);
	return {
		yScale: { ...DEFAULT_CONFIGS.yScale, min, max, reverse },
		axisLeft: { ...axisLeft, tickValues },
		gridYValues: tickValues,
	};
}
