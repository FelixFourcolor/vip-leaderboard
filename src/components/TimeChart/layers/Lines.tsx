import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import type { NivoSeries } from "../Chart";
import { useChart } from "../context";
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

	return (
		<g style={{ ["--series-color" as string]: color }}>
			<path
				d={path}
				className={cx("outline", { visible: !stacked && isHighlighted(id) })}
			/>
			<path d={path} className={cx("line", { stacked, muted: isMuted(id) })} />
		</g>
	);
}
