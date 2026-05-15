import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { useMemo } from "react";
import type { NivoPoint, NivoSeries } from "../Chart";
import { useChart } from "../context";
import styles from "../TimeChart.module.css";

const cx = classNames.bind(styles);

export function Labels({
	series,
	innerHeight,
}: LineCustomSvgLayerProps<NivoSeries>) {
	const shouldShowLabel = useVisibility();
	const getYPosition = useYPosition();

	return (
		<g>
			{series.map(({ id, data }, seriesIndex) => {
				return data.map(({ position, data }, pointIndex) => {
					if (!shouldShowLabel(id, pointIndex, data)) {
						return null;
					}
					return (
						<text
							key={`${id}-${data.x}`}
							x={position.x}
							y={getYPosition(series, innerHeight, seriesIndex, pointIndex)}
							className={cx("label")}
						>
							{String(data.y)}
						</text>
					);
				});
			})}
		</g>
	);
}

function useVisibility() {
	const {
		xValues,
		cumulative,
		stacked,
		chartData,
		isPointIsolated,
		isHighlighted,
		isPointHovered,
	} = useChart();

	const lastIndex = useMemo(() => {
		if (!cumulative || stacked) {
			return null;
		}
		return Object.fromEntries(
			chartData.map(({ id, data }) => {
				const lastNonNullIndex = data.reduce(
					(prevIndex, { y }, index) => (y ? index : prevIndex),
					0,
				);
				return [id, lastNonNullIndex];
			}),
		);
	}, [chartData, cumulative, stacked]);

	const labelsCount = cumulative ? 10 : 20;
	const labelInterval = Math.max(1, Math.ceil(xValues.length / labelsCount));
	const isLabelIndex = (i: number, seriesId: string) =>
		// reversed to show label at the end
		(-i + (lastIndex?.[seriesId] ?? xValues.length - 1)) % labelInterval === 0;

	return (seriesId: string, index: number, { x, y }: NivoPoint) =>
		y &&
		isHighlighted(seriesId) &&
		(stacked || !isPointHovered({ seriesId, x })) &&
		(isLabelIndex(index, seriesId) || isPointIsolated({ seriesId, x }));
}

function useYPosition() {
	const { stacked } = useChart();

	return (
		series: LineCustomSvgLayerProps<NivoSeries>["series"],
		innerHeight: number,
		seriesIndex: number,
		pointIndex: number,
	) => {
		const y1 = series[seriesIndex]!.data[pointIndex]!.position.y;

		if (!stacked) {
			return y1 - 12;
		}

		const y0 =
			seriesIndex === 0
				? innerHeight
				: series[seriesIndex - 1]!.data[pointIndex]!.position.y;

		return (y1 + y0) / 2;
	};
}
