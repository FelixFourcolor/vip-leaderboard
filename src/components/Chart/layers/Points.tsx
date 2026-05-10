import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { Tooltip } from "@/components/Tooltip";
import { UserHeader } from "@/components/UserHeader";
import { toYyyyMm } from "@/utils/time";
import type { ChartDataPoint, ChartSeries } from "../Chart";
import styles from "../Chart.module.css";
import { useChartControls } from "../Controls";
import { useChart } from "../context";

const cx = classNames.bind(styles);

export function ChartPoints({ series }: LineCustomSvgLayerProps<ChartSeries>) {
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
						<Point seriesId={id} color={color} data={data} />
					</g>
				));
			})}
		</g>
	);
}

type PointProps = {
	seriesId: string;
	color: string;
	data: ChartDataPoint;
};

function Point({ data, seriesId, color }: PointProps) {
	const { isPointHovered } = useChart();

	const Renderer = isPointHovered({ seriesId, x: data.x })
		? HoveredPoint
		: IsolatedPoint;

	return <Renderer seriesId={seriesId} color={color} data={data} />;
}

function IsolatedPoint({ seriesId, color, data: { x } }: PointProps) {
	const { isHighlighted, isPointIsolated } = useChart();

	if (!isPointIsolated({ seriesId, x })) {
		return null;
	}

	const highlighted = isHighlighted(seriesId);

	return (
		<g style={{ ["--series-color" as string]: color }}>
			<circle className={cx("outline", { visible: highlighted })} />
			<circle className={cx("point", { highlighted })} />
		</g>
	);
}

function HoveredPoint({ seriesId, color, data }: PointProps) {
	const { chartData } = useChart();
	const [{ stacked }] = useChartControls();

	const colorStyle = { ["--series-color" as string]: color };

	return (
		<Tooltip
			offset={stacked ? -6 : 4}
			element={({ ref }) => (
				<g ref={ref} style={colorStyle}>
					<circle className={cx("hovered", "outer", { visible: !stacked })} />
					<circle className={cx("hovered", "inner", { visible: !stacked })} />
				</g>
			)}
			content={({ ref, style }) => (
				<div
					ref={ref}
					style={{ ...colorStyle, ...style }}
					className={cx("info-box", "tooltip")}
				>
					<UserHeader {...chartData[seriesId]!} />
					<table>
						<tbody>
							<tr>
								<th>{toYyyyMm(data.x)}</th>
								<td>{data.y}</td>
							</tr>
						</tbody>
					</table>
				</div>
			)}
		/>
	);
}
