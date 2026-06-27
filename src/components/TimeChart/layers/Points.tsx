import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { createContext, type Ref, use, useMemo } from "react";
import { Tooltip, type TooltipContentProps } from "@/components/Tooltip";
import { windowed3 } from "@/utils/array";
import { toYyyyMm, type YyyyMm } from "@/utils/time";
import type { ChartPoint, ChartSeries } from "../Chart";
import type { TimePoint, TimeSeries } from "../ChartWrapper";
import { useChart } from "../chartContext";
import styles from "../TimeChart.module.css";

const cx = classNames.bind(styles);

export function Points({ series }: LineCustomSvgLayerProps<ChartSeries>) {
	const { seriesData = [], chartData = [], area, cumulative } = useChart();

	const seriesMap = useMemo(
		() => Object.fromEntries(seriesData.map((series) => [series.id, series])),
		[seriesData],
	);

	const isolatedPoints = useMemo(() => {
		if (area || cumulative) {
			return {};
		}
		return Object.fromEntries(
			chartData.map(({ id, data }) => {
				const isolatedXValues = new Set(
					windowed3(data)
						.filter(([prev, curr, next]) => !prev?.y && curr.y && !next?.y)
						.map(([, { x }]) => toYyyyMm(x)),
				);
				return [id, isolatedXValues];
			}),
		);
	}, [chartData, area, cumulative]);

	return (
		<g data-points-layer>
			<IsolatedPointsContext value={isolatedPoints}>
				{series.map(({ id, data, color }) =>
					data
						.filter(({ data }) => data.y !== null)
						.map(({ data, position: { x, y } }) => (
							<g key={`${id}-${data.x}`} transform={`translate(${x},${y})`}>
								<Point series={seriesMap[id]!} color={color} data={data} />
							</g>
						)),
				)}
			</IsolatedPointsContext>
		</g>
	);
}

const IsolatedPointsContext = createContext<Record<string, Set<YyyyMm>>>({});

type PointProps = {
	series: TimeSeries;
	color: string;
	data: ChartPoint;
};
function Point({ data, series, color }: PointProps) {
	const { isPointHovered } = useChart();
	const isolatedPoints = use(IsolatedPointsContext);

	if (isPointHovered({ seriesId: series.id, x: data.x })) {
		return <HoveredPoint series={series} color={color} data={data} />;
	}
	if (isolatedPoints[series.id]?.has(toYyyyMm(data.x))) {
		return <IsolatedPoint seriesId={series.id} color={color} />;
	}
}

type IsolatedPointProps = {
	seriesId: string;
	color: string;
};
function IsolatedPoint({ seriesId, color }: IsolatedPointProps) {
	const { isMuted, isHighlighted } = useChart();

	const highlighted = isHighlighted(seriesId);
	const muted = isMuted(seriesId);

	return (
		<g style={{ ["--series-color" as string]: color }}>
			<circle className={cx("outline", { highlighted })} />
			<circle className={cx("point", { highlighted, muted })} />
		</g>
	);
}

export type PointTooltipProps<S extends TimeSeries> = TooltipContentProps & {
	data: TimePoint & { rank?: number };
	series: Omit<S, "data">;
	seriesColor: string;
};

function HoveredPoint({ series, color, data: { x, value, rank } }: PointProps) {
	const { area, PointTooltip } = useChart();

	if (!PointTooltip) {
		return area ? null : <HighlightedPoint color={color} area={area} />;
	}

	return (
		<Tooltip
			open
			placement="top"
			offset={area ? -6 : 4}
			trigger={({ ref }) => (
				<HighlightedPoint ref={ref} color={color} area={area} />
			)}
			content={({ ref, style }) => (
				<PointTooltip
					ref={ref}
					style={style}
					data={{ month: toYyyyMm(x), value, rank }}
					series={series}
					seriesColor={color}
				/>
			)}
		/>
	);
}

type HighlightedPointProps = {
	color: string;
	area: boolean;
	ref?: Ref<SVGGElement>;
};
const HighlightedPoint = ({ color, ref, area }: HighlightedPointProps) => (
	<g ref={ref} style={{ ["--series-color" as string]: color }}>
		<circle className={cx("hovered", "outer", { "area-mode": area })} />
		<circle className={cx("hovered", "inner", { "area-mode": area })} />
	</g>
);
