import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { Fragment } from "react/jsx-runtime";
import type { ChartSeries } from "../Chart";
import { useChart } from "../context";
import styles from "../TimeChart.module.css";

const cx = classNames.bind(styles);

export function Lines({
	series,
	lineGenerator,
	yScale,
}: LineCustomSvgLayerProps<ChartSeries>) {
	const { ranked, area } = useChart();
	return (
		<g>
			{series.map(({ id, data, color }) => (
				<Fragment key={id}>
					<Line
						seriesId={id}
						path={lineGenerator(data.map((d) => d.position))}
						color={color}
					/>
					{ranked && area && (
						<Line
							seriesId={id}
							path={lineGenerator(
								data.map(({ position: { x }, data: { y, value } }) => ({
									x,
									y: yScale((y ?? 0) - (value ?? 0)),
								})),
							)}
							color={color}
						/>
					)}
				</Fragment>
			))}
		</g>
	);
}

type LineProps = {
	seriesId: string;
	path: string | null;
	color: string;
};
function Line({ seriesId, path, color }: LineProps) {
	const { area, isHighlighted, isMuted } = useChart();
	const highlighted = isHighlighted(seriesId);
	const muted = isMuted(seriesId);

	return (
		<g style={{ ["--series-color" as string]: color }}>
			{!area && (
				<path
					d={path ?? undefined}
					className={cx("outline", { highlighted })}
				/>
			)}
			<path
				d={path ?? undefined}
				className={cx("line", { "area-mode": area, highlighted, muted })}
			/>
		</g>
	);
}
