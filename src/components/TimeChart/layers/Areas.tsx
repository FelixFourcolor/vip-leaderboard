import { curveFromProp, useAnimatedPath } from "@nivo/core";
import type { LineCustomSvgLayerProps } from "@nivo/line";
import { animated } from "@react-spring/web";
import classNames from "classnames/bind";
import { area } from "d3-shape";
import { zip } from "es-toolkit";
import { windowed } from "@/utils/array";
import { useChart } from "../context";
import type { NivoSeries } from "../TimeChart";
import styles from "../TimeChart.module.css";

const cx = classNames.bind(styles);

export function Areas({
	series,
	curve,
	yScale,
}: LineCustomSvgLayerProps<NivoSeries>) {
	const { stacked } = useChart();
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
			{windowed(series, 2).map(([prev, { id, data, color }]) => {
				const upper = data.map((d) => d.position);
				const lower = prev
					? prev.data.map((d) => d.position)
					: upper.map(({ x }) => ({ x, y: yScale(0) }));

				const path =
					bandGenerator(
						zip(lower, upper).map(([L, U]) => ({
							x: L.x,
							y0: L.y,
							y1: U.y,
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
