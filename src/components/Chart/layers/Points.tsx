import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { Tooltip } from "@/components/Tooltip";
import { UserHeader } from "@/components/UserHeader";
import { toYyyyMm } from "@/utils/time";
import type { ChartPoint, ChartSeries } from "../Chart";
import styles from "../Chart.module.css";
import { useChart } from "../context";

const cx = classNames.bind(styles);

export function ChartPoints({ series }: LineCustomSvgLayerProps<ChartSeries>) {
	return (
		<g>
			{series.map(({ id, data, color }) => {
				return data.map(({ data, position }) => (
					<g
						key={`${id}-${data.x}`}
						transform={`translate(${position.x},${position.y})`}
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
	data: ChartPoint;
};

function Point(props: PointProps) {
	const { hoveredPoint } = useChart();

	const isHovered =
		hoveredPoint?.x.getTime() === props.data.x.getTime() &&
		hoveredPoint.y === props.data.y;

	return (isHovered ? HoveredPoint : IsolatedPoint)(props);
}

function IsolatedPoint({ seriesId, color, data }: PointProps) {
	const { highlightedUser, isolatedPoints } = useChart();

	const isolated = isolatedPoints[seriesId]?.has(toYyyyMm(data.x));
	if (!isolated) {
		return null;
	}

	const highlighted = highlightedUser === seriesId;
	return (
		<g style={{ ["--series-color" as string]: color }}>
			<circle className={cx("outline", { visible: highlighted })} />
			<circle className={cx("point", { highlighted })} />
		</g>
	);
}

function HoveredPoint({ seriesId, color, data }: PointProps) {
	const { chartData } = useChart();

	const colorStyle = { ["--series-color" as string]: color };

	return (
		<Tooltip
			element={({ ref }) => (
				<g ref={ref} style={colorStyle}>
					<circle className={cx("outer")} />
					<circle className={cx("inner")} />
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
