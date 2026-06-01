import { curveFromProp } from "@nivo/core";
import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { area } from "d3-shape";
import { windowed } from "@/utils/array";
import type { NivoSeries } from "../Chart";
import { useChart } from "../context";
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
			{windowed(series, 2).map(([prev, { id, data, color }]) => (
				<Area
					key={id}
					seriesId={id}
					color={color}
					path={bandGenerator(
						data.map((d, i) => ({
							x: d.position.x,
							y1: d.position.y,
							y0: prev ? prev.data[i]!.position.y : yScale(0),
						})),
					)}
				/>
			))}
		</g>
	);
}

type AreaProps = {
	seriesId: string;
	path: string | null;
	color: string;
};
function Area({ seriesId, path, color }: AreaProps) {
	const { isHighlighted, isMuted } = useChart();
	const highlighted = isHighlighted(seriesId);
	const muted = isMuted(seriesId);

	return (
		<path
			d={path ?? undefined}
			style={{ ["--series-color" as string]: color }}
			className={cx("area", { highlighted, muted })}
		/>
	);
}
