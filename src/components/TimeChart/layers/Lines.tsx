import { useAnimatedPath } from "@nivo/core";
import type { LineCustomSvgLayerProps } from "@nivo/line";
import { animated } from "@react-spring/web";
import classNames from "classnames/bind";
import { useChart } from "../context";
import type { NivoSeries } from "../TimeChart";
import styles from "../TimeChart.module.css";

const cx = classNames.bind(styles);

export function Lines({
	series,
	lineGenerator,
}: LineCustomSvgLayerProps<NivoSeries>) {
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
	const { stacked, isHighlighted, isMuted } = useChart();
	const animatedPath = useAnimatedPath(path);

	return (
		<g style={{ ["--series-color" as string]: color }}>
			<animated.path
				d={animatedPath}
				className={cx("outline", { visible: !stacked && isHighlighted(id) })}
			/>
			<animated.path
				d={animatedPath}
				className={cx("line", { stacked, muted: isMuted(id) })}
			/>
		</g>
	);
}
