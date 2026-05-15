import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { type CSSProperties, type Ref, useMemo } from "react";
import { Tooltip } from "@/components/Tooltip";
import { toYyyyMm } from "@/utils/time";
import type { NivoPoint, NivoSeries } from "../Chart";
import { useChart } from "../context";
import type { ChartPoint, ChartSeries } from "../TimeChart";
import styles from "../TimeChart.module.css";

const cx = classNames.bind(styles);

export function Points({ series }: LineCustomSvgLayerProps<NivoSeries>) {
	const { chartData } = useChart();
	const seriesMap = useMemo(() => {
		return Object.fromEntries(chartData.map((series) => [series.id, series]));
	}, [chartData]);

	return (
		<g>
			{series.map(({ id, data, color }) => {
				return data.map(({ data, position: { x, y } }) => (
					<g
						key={`${id}-${data.x}`}
						// idk why some ys are null, they aren't rendered anyway,
						// set it to 0 to supress console error
						transform={`translate(${x},${y ?? 0})`}
					>
						<Point series={seriesMap[id]!} color={color} data={data} />
					</g>
				));
			})}
		</g>
	);
}

type PointProps = {
	series: ChartSeries;
	color: string;
	data: NivoPoint;
};

function Point({ data, series, color }: PointProps) {
	const { isPointHovered } = useChart();

	const Renderer = isPointHovered({ seriesId: series.id, x: data.x })
		? HoveredPoint
		: IsolatedPoint;

	return <Renderer series={series} color={color} data={data} />;
}

function IsolatedPoint({ series, color, data: { x } }: PointProps) {
	const { isHighlighted, isPointIsolated } = useChart();

	if (!isPointIsolated({ seriesId: series.id, x })) {
		return null;
	}

	const highlighted = isHighlighted(series.id);

	return (
		<g style={{ ["--series-color" as string]: color }}>
			<circle className={cx("outline", { visible: highlighted })} />
			<circle className={cx("point", { highlighted })} />
		</g>
	);
}

export type PointTooltipProps<S extends ChartSeries> = {
	data: ChartPoint;
	series: Omit<S, "data">;
	seriesColor: string;
	ref: Ref<any>;
	style: CSSProperties;
};

function HoveredPoint({ series, color, data: { x, y } }: PointProps) {
	const { stacked, PointTooltip } = useChart();

	if (!PointTooltip) {
		if (stacked) {
			return null;
		}

		return <HighlightedPoint color={color} stacked={stacked} />;
	}

	return (
		<Tooltip
			offset={stacked ? -6 : 4}
			element={({ ref }) => (
				<HighlightedPoint ref={ref} color={color} stacked={stacked} />
			)}
			content={({ ref, style }) => (
				<PointTooltip
					ref={ref}
					style={style}
					data={{ x: toYyyyMm(x), y }}
					series={series}
					seriesColor={color}
				/>
			)}
		/>
	);
}

type HighlightedPointProps = {
	color: string;
	stacked: boolean;
	ref?: Ref<SVGGElement>;
};
function HighlightedPoint({ color, stacked, ref }: HighlightedPointProps) {
	return (
		<g style={{ ["--series-color" as string]: color }} ref={ref}>
			<circle className={cx("hovered", "outer", { visible: !stacked })} />
			<circle className={cx("hovered", "inner", { visible: !stacked })} />
		</g>
	);
}
