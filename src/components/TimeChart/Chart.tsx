import { ResponsiveLine } from "@nivo/line";
import classNames from "classnames/bind";
import { partition, range } from "es-toolkit";
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
	const { chartRef, svgRef, width, height, margin } = useSize(configs);
	const { gridXValues, axisBottom } = useHorizontalScale(configs, width);
	const { yScale, axisLeft, gridYValues } = useVerticalScale(configs, height);

	return (
		<div ref={chartRef} className={cx("chart", className)}>
			{renderReady && data ? (
				<ResponsiveLine
					{...DEFAULT_CONFIGS}
					ref={svgRef}
					margin={margin}
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
	xFormat: "time:%Y-%m",
	xScale: { type: "time" },
	yScale: { type: "linear", nice: false },
	axisBottom: { format: "%Y-%m", tickSize: 0 },
	axisLeft: { tickSize: 0 },
	margin: { top: 28, right: 28, bottom: 28, left: 28 },
	layers: ["grid", "axes", Areas, Lines, Points, Labels, Interaction],
	theme: {
		background: "var(--bg-secondary)",
		text: { fontFamily: "inherit" },
		axis: {
			ticks: {
				line: {
					stroke: "var(--text-tertiary)",
					strokeWidth: 0.3,
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
				strokeWidth: 0.3,
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

function useSize(configs: ChartProps) {
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const chartRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const chart = chartRef.current;
		if (!chart) {
			return;
		}
		const observer = new ResizeObserver(([entry]) => {
			if (entry) {
				const { width, height } = entry.contentRect;
				setWidth(width);
				setHeight(height);
			}
		});
		observer.observe(chart);
		return () => observer.disconnect();
	}, []);

	const [svg, svgRef] = useState<SVGSVGElement | null>();
	const [rect, setRect] = useState<SVGRectElement | null>(null);

	const margin = { ...DEFAULT_CONFIGS.margin, ...configs.margin };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;

	useEffect(() => {
		rect?.setAttribute("width", String(innerWidth));
		rect?.setAttribute("height", String(innerHeight));
	}, [rect, innerHeight, innerWidth]);

	useEffect(() => {
		if (!svg) {
			return;
		}
		setRect((alreadySet) => {
			if (alreadySet) {
				return alreadySet;
			}

			let defs = svg.querySelector("defs");
			if (!defs) {
				defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
				svg.prepend(defs);
			}

			let clipPath = defs.querySelector("clipPath");
			if (!clipPath) {
				clipPath = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"clipPath",
				);
				clipPath.id = "chart-clip-path";
				defs.appendChild(clipPath);
			}

			let rect = clipPath.querySelector("rect");
			if (!rect) {
				rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
				rect.setAttribute("x", "0");
				rect.setAttribute("y", "0");
				clipPath.appendChild(rect);
			}
			return rect;
		});
	}, [svg]);

	return { chartRef, svgRef, width, height, margin };
}

const LABEL_WIDTH = 64; // estimate based on current styles
function useHorizontalScale(configs: ChartProps, chartWidth: number) {
	const margin = { ...DEFAULT_CONFIGS.margin, ...configs.margin };
	const availableWidth = chartWidth - margin.left - margin.right;
	const labelsCount = Math.max(Math.floor(availableWidth / LABEL_WIDTH), 2);

	const { xValues } = useChart();
	const interval = Math.ceil((xValues.length - 1) / (labelsCount - 1));
	const tickValues = useMemo(() => {
		return range(xValues.length - 1, -1, -Math.max(interval, 1))
			.map((i) => xValues[i]!)
			.map(toDate);
	}, [xValues, xValues.length, interval]);

	return {
		axisBottom: { ...DEFAULT_CONFIGS.axisBottom, tickValues },
		gridXValues: tickValues,
	};
}

const LABEL_HEIGHT = 32; // estimate based on current styles
const NICE_INTERVALS = [
	1, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000,
] as const;
function useVerticalScale(configs: ChartProps, chartHeight: number) {
	const margin = { ...DEFAULT_CONFIGS.margin, ...configs.margin };
	const availableHeight = chartHeight - margin.top - margin.bottom;
	const labelsCount = Math.min(
		Math.max(Math.floor(availableHeight / LABEL_HEIGHT), 2),
		12,
	);

	const { min, max } = useMinMax();
	const interval = Math.ceil((max - min) / (labelsCount - 1));
	const niceInterval = useMemo(() => {
		for (const i of NICE_INTERVALS) {
			if (interval <= i) {
				return i;
			}
		}
		return interval;
	}, [interval]);
	const tickValues = useMemo(() => {
		const values = range(
			niceInterval * Math.ceil(min / niceInterval),
			niceInterval * Math.floor(max / niceInterval) + 1,
			niceInterval,
		);
		return [
			...((values[0] ?? min) - min >= interval ? [min] : []),
			...values,
			...(max - (values.at(-1) ?? max) >= interval ? [max] : []),
		];
	}, [min, max, interval, niceInterval]);

	const { area, ranked } = useChart();
	const reverse = !area && ranked;

	return {
		yScale: { ...DEFAULT_CONFIGS.yScale, min, max, reverse },
		axisLeft: { ...DEFAULT_CONFIGS.axisLeft, ...configs.axisLeft, tickValues },
		gridYValues: tickValues,
	};
}

function useMinMax() {
	const { chartData, cumulative, ranked, area } = useChart();

	return useMemo(() => {
		if (!chartData?.length) {
			return { min: Infinity, max: 0 };
		}

		if (cumulative && (!ranked || area)) {
			const min = (() => {
				const { data } = chartData[chartData.length - 1]!;
				for (let i = 0; i < data.length; ++i) {
					const { y, value } = data[i]!;
					if (y != null) {
						return area ? y - value : y;
					}
				}
				return Infinity;
			})();
			const max = (() => {
				const { data } = chartData[0]!;
				for (let i = data.length; i--; ) {
					const { y } = data[i]!;
					if (y != null) {
						return y;
					}
				}
				return 0;
			})();
			return { min, max };
		}

		if (area && !ranked) {
			const min = chartData[chartData.length - 1]!.data.reduce(
				(best, { y: yMax, value }) => {
					if (yMax != null) {
						const y = yMax - value;
						if (y < best) {
							return y;
						}
					}
					return best;
				},
				Infinity,
			);
			const max = chartData[0]!.data.reduce((best, { y }) => {
				if (y != null) {
					if (y > best) {
						return y;
					}
				}
				return best;
			}, 0);
			return { min, max };
		}

		return chartData
			.flatMap((s) => s.data)
			.reduce(
				(best, { y: yMax, value }) => {
					if (yMax != null) {
						const yMin = area ? yMax - value : yMax;
						if (yMin < best.min) {
							best.min = yMin;
						}
						if (yMax > best.max) {
							best.max = yMax;
						}
					}
					return best;
				},
				{ min: Infinity, max: 0 },
			);
	}, [chartData, area, ranked, cumulative]);
}
