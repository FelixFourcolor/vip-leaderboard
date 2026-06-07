import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { type Ref, useMemo } from "react";
import { Tooltip, type TooltipContentProps } from "@/components/Tooltip";
import { toYyyyMm } from "@/utils/time";
import type { ChartPoint, ChartSeries } from "../Chart";
import type { TimePoint, TimeSeries } from "../ChartWrapper";
import { useChart } from "../context";
import styles from "../TimeChart.module.css";

const cx = classNames.bind(styles);

export function Points({ series }: LineCustomSvgLayerProps<ChartSeries>) {
	const { seriesData = [] } = useChart();
	const seriesMap = useMemo(
		() => Object.fromEntries(seriesData.map((series) => [series.id, series])),
		[seriesData],
	);

	return (
		<g>
			{series.map(({ id, data, color }) => {
				return data.map(({ data, position: { x, y } }) => (
					<g key={`${id}-${data.x}`} transform={`translate(${x},${y})`}>
						<Point series={seriesMap[id]!} color={color} data={data} />
					</g>
				));
			})}
		</g>
	);
}

type PointProps = {
	series: TimeSeries;
	color: string;
	data: ChartPoint;
};

function Point({ data, series, color }: PointProps) {
	const { isPointHovered } = useChart();

	const Renderer = isPointHovered({ seriesId: series.id, x: data.x })
		? HoveredPoint
		: IsolatedPoint;

	return <Renderer series={series} color={color} data={data} />;
}

function IsolatedPoint({ series, color, data: { x } }: PointProps) {
	const { isMuted, isHighlighted, isPointIsolated } = useChart();

	if (!isPointIsolated({ seriesId: series.id, x })) {
		return null;
	}

	const highlighted = isHighlighted(series.id);
	const muted = isMuted(series.id);

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
