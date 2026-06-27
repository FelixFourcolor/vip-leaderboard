import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { Fragment } from "react/jsx-runtime";
import type { ChartSeries } from "../Chart";
import { useChart } from "../chartContext";
import styles from "../TimeChart.module.css";

const cx = classNames.bind(styles);

export function Lines({
	series,
	lineGenerator,
	yScale,
}: LineCustomSvgLayerProps<ChartSeries>) {
	const { ranked, area } = useChart();
	return (
		<g data-lines-layer>
			{series.map(({ id, data, color }, seriesIndex) => (
				<Fragment key={id}>
					<Line
						seriesId={id}
						path={lineGenerator(data.map((d) => d.position))}
						color={color}
					/>
					{area && (ranked || seriesIndex === series.length - 1) && (
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

	const d = path ?? undefined;
	return (
		<g style={{ ["--series-color" as string]: color }}>
			{!area && (
				<>
					<path // hit box for hover
						d={d}
						fill="none"
						stroke="transparent"
						strokeWidth={64}
						data-series-id={seriesId}
					/>
					<path d={d} className={cx("outline", { highlighted })} />
				</>
			)}
			<path
				d={d}
				className={cx("line", { "area-mode": area, highlighted, muted })}
			/>
		</g>
	);
}
