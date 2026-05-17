import { ResponsiveLine } from "@nivo/line";
import classNames from "classnames/bind";
import {
	type ComponentProps,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toDate } from "@/utils/time";
import { useChart } from "./context";
import { Areas } from "./layers/Areas";
import { Interaction } from "./layers/Interaction";
import { Labels } from "./layers/Labels";
import { Lines } from "./layers/Lines";
import { Points } from "./layers/Points";
import styles from "./TimeChart.module.css";
import type { TimeSeries } from "./TimeChartProvider";

const cx = classNames.bind(styles);

export type NivoSeries = { id: string; data: NivoPoint[] };
export type NivoPoint = { x: Date; y: number | null };

type NivoProps = ComponentProps<typeof ResponsiveLine<NivoSeries>>;

type TimeChartProps = {
	margin?: NivoProps["margin"];
	axisLeft?: Pick<
		NonNullable<NivoProps["axisLeft"]>,
		"legendOffset" | "legendPosition"
	>;
	className?: string;
};
export function TimeChart({ className, ...configs }: TimeChartProps) {
	const data = useNivoData();
	const colors = useColors();
	const { chartRef, gridXValues, axisBottom } = useHorizontalScale(configs);
	const { yScale, axisLeft, gridYValues } = useVerticalScale(configs);

	return (
		<div ref={chartRef} className={cx("chart", className)}>
			{data.length > 0 ? (
				<ResponsiveLine
					{...CONFIGS}
					margin={{ ...CONFIGS.margin, ...configs.margin }}
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

const CONFIGS = {
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
		text: { fill: "var(--text-primary)" },
		axis: {
			ticks: {
				line: {
					stroke: "var(--text-tertiary)",
					strokeWidth: 0.5,
				},
				text: {
					fill: "var(--text-secondary)",
					fontWeight: "bold",
				},
			},
			legend: {
				text: { fontSize: "var(--text-normal)" },
			},
		},
		grid: {
			line: {
				stroke: "var(--text-tertiary)",
				strokeWidth: 0.5,
			},
		},
	},
} satisfies Partial<ComponentProps<typeof ResponsiveLine<NivoSeries>>>;

function useNivoData(): NivoSeries[] {
	const { chartData, stacked } = useChart();

	const nivoData = useMemo(() => {
		return chartData.map(({ id, data }) => ({
			id: String(id),
			data: data.map(({ x, y }) => ({ x: new Date(x), y })),
		}));
	}, [chartData]);

	return useMemo(() => {
		if (!stacked) {
			return nivoData;
		}
		// to draw higher-ranked series above (idk why nivo does it reversed)
		return [...nivoData].reverse();
	}, [nivoData, stacked]);
}

function useColors() {
	const { colorMapping, isMuted, isHighlighted } = useChart();
	return ({ id }: { id: string }) => {
		const color = colorMapping[id]!;
		if (isHighlighted(id)) {
			return color;
		} else if (isMuted(id)) {
			return `rgb(from ${color} r g b / 0.45)`;
		}
		return `rgb(from ${color} r g b / 0.85)`;
	};
}

const fontSize = 12;
const gap = 12;
const labelWidth = 7 * fontSize * 0.6 + gap;
function useHorizontalScale({ margin }: TimeChartProps) {
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
		const innerWidth = Math.max(
			0,
			width - (margin?.left ?? 0) - (margin?.right ?? 0),
		);
		const maxLabels = Math.max(2, Math.floor(innerWidth / labelWidth));
		const interval = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));

		const tickValues = xValues
			.filter((_, index) => (count - 1 - index) % interval === 0)
			.map(toDate);

		return {
			chartRef,
			xLabels: xValues,
			axisBottom: { ...CONFIGS.axisBottom, tickValues },
			gridXValues: tickValues,
		};
	}, [margin, xValues, width]);
}

function findMaxClamped(
	chartData: readonly TimeSeries[],
	stacked: boolean,
	threshold: number,
) {
	function whenStacked() {
		let max = 0;

		const seriesLength = chartData[0]?.data.length ?? 0;
		for (let i = 0; i < seriesLength; ++i) {
			const count = chartData
				.map(({ data }) => data[i]?.y ?? 0)
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
		for (const { data } of chartData) {
			for (const { y } of data) {
				if (y == null) {
					continue;
				}
				if (y >= threshold) {
					return threshold;
				}
				if (y > max) {
					max = y;
				}
			}
		}
		return max;
	}

	return stacked ? whenStacked() : whenNotStacked();
}
function useVerticalScale({ axisLeft }: TimeChartProps) {
	const { chartData, stacked } = useChart();

	return useMemo(() => {
		const maxClamped = findMaxClamped(chartData, stacked, 8);

		const max = maxClamped >= 8 ? ("auto" as const) : maxClamped;
		const min = stacked ? 0 : 1;

		const tickValues =
			maxClamped >= 8
				? undefined
				: Array.from({ length: maxClamped - min + 1 }, (_, i) => i + min);

		return {
			yScale: { ...CONFIGS.yScale, min, max, stacked },
			axisLeft: { ...axisLeft, tickValues },
			gridYValues: tickValues,
		};
	}, [chartData, stacked, axisLeft]);
}
