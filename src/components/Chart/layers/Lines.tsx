import { useAnimatedPath } from "@nivo/core";
import type { LineCustomSvgLayerProps } from "@nivo/line";
import { animated } from "@react-spring/web";
import classNames from "classnames/bind";
import type { ChartSeries } from "../Chart";
import styles from "../Chart.module.css";
import { useChartControls } from "../Controls";
import { useChart } from "../context";

const cx = classNames.bind(styles);

export function ChartLines({
	series,
	lineGenerator,
}: LineCustomSvgLayerProps<ChartSeries>) {
	return (
		<g>
			{series.map(({ id, data, color }) => (
				<Line
					key={id}
					id={id}
					path={lineGenerator(data.map((d) => d.position)) ?? ""}
					color={color}
				/>
			))}
		</g>
	);
}

type LineProps = {
	id: string;
	path: string;
	color: string;
};
function Line({ id, path, color }: LineProps) {
	const { highlightedUser } = useChart();
	const [{ stacked }] = useChartControls();
	const animatedPath = useAnimatedPath(path);

	const highlighted = highlightedUser === id;
	const dimmed = highlightedUser && !highlighted;

	return (
		<g style={{ ["--series-color" as string]: color }}>
			<animated.path
				d={animatedPath}
				className={cx("outline", { visible: !stacked && highlighted })}
			/>
			<animated.path
				d={animatedPath}
				className={cx("line", { stacked, dimmed })}
			/>
		</g>
	);
}
