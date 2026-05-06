import { curveFromProp, useAnimatedPath } from "@nivo/core";
import type { LineCustomSvgLayerProps } from "@nivo/line";
import { animated } from "@react-spring/web";
import classNames from "classnames/bind";
import { area } from "d3-shape";
import type { ChartSeries } from "../Chart";
import styles from "../Chart.module.css";
import { useChartControls } from "../Controls";
import { useChart } from "../context";

const cx = classNames.bind(styles);

export function ChartAreas({
	series,
	curve,
	yScale,
}: LineCustomSvgLayerProps<ChartSeries>) {
	const [{ stacked }] = useChartControls();
	if (!stacked) {
		return null;
	}

	const bandGenerator = area<{ x: number; y0: number; y1: number }>()
		.x(({ x }) => x)
		.y0(({ y0 }) => y0)
		.y1(({ y1 }) => y1)
		.curve(curveFromProp(curve));

	return (
		<g>
			{series.map(({ id, data, color }, index) => {
				const upper = data.map((d) => d.position);
				const lower =
					index === 0
						? upper.map(({ x }) => ({ x, y: yScale(0) }))
						: series[index - 1]!.data.map((d) => d.position);

				const path =
					bandGenerator(
						upper.map(({ x, y }, i) => ({
							x,
							y0: lower[i]!.y,
							y1: y,
						})),
					) ?? "";

				return <Area key={id} id={id} path={path} color={color} />;
			})}
		</g>
	);
}

type AreaProps = {
	id: string;
	path: string;
	color: string;
};
function Area({ id, path, color }: AreaProps) {
	const { isHighlighted, isMuted } = useChart();

	return (
		<animated.path
			d={useAnimatedPath(path)}
			style={{ ["--series-color" as string]: color }}
			className={cx("area", {
				highlighted: isHighlighted(id),
				muted: isMuted(id),
			})}
		/>
	);
}
