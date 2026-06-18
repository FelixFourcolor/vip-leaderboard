import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { useEffect, useMemo, useState } from "react";
import type { ChartPoint, ChartSeries } from "../Chart";
import { useChart } from "../chartContext";
import styles from "../TimeChart.module.css";
import { useChartZoom } from "../zoomContext";

const cx = classNames.bind(styles);

export function Labels({
	series,
	yScale,
}: LineCustomSvgLayerProps<ChartSeries>) {
	const shouldShowLabel = useVisibility();
	const getYPosition = useYPosition(series, yScale);

	return (
		<g data-labels-layer>
			{series.map(({ id, data }, seriesIndex) => {
				return data.map(({ position, data }, pointIndex) => {
					if (shouldShowLabel(id, pointIndex, data)) {
						return (
							<Label
								key={`${id}-${data.x}`}
								{...data}
								x={position.x}
								y={getYPosition(seriesIndex, pointIndex)}
							/>
						);
					}
				});
			})}
		</g>
	);
}

type LabelProps = {
	x: number;
	y: number;
	value: number;
	rank?: number;
};
function Label({ value, rank, ...xy }: LabelProps) {
	const [showRank, setShowRank] = useState(!!rank);

	useEffect(() => {
		if (!rank) {
			return;
		}
		const timer = setInterval(() => setShowRank((current) => !current), 1000);
		return () => clearInterval(timer);
	}, [rank]);

	return (
		<text {...xy} className={cx("label")}>
			{showRank ? `#${rank}` : value}
		</text>
	);
}

function useVisibility() {
	const {
		cumulative,
		area,
		chartData,
		isPointIsolated,
		isHighlighted,
		isPointHovered,
		PointTooltip,
	} = useChart();
	const {
		xValues,
		xZoom: [startOffset, endOffset],
	} = useChartZoom();

	const lastIndexMap = useMemo(() => {
		if (!cumulative || area || !chartData) {
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
	}, [chartData, cumulative, area]);

	const labelsCount = cumulative ? 10 : 20;
	const xLength = xValues.slice(
		Math.ceil(startOffset),
		-Math.ceil(endOffset) || undefined,
	).length;
	const labelInterval = Math.max(1, Math.ceil(xLength / labelsCount));
	const isLabelIndex = (i: number, seriesId: string) =>
		// reversed to show label at the end
		(-i + (lastIndexMap?.[seriesId] ?? xLength - 1)) % labelInterval === 0;

	return (seriesId: string, index: number, { x, value }: ChartPoint) =>
		value &&
		isHighlighted(seriesId) &&
		(area || !PointTooltip || !isPointHovered({ seriesId, x })) &&
		(isLabelIndex(index, seriesId) || isPointIsolated({ seriesId, x }));
}

function useYPosition(
	series: LineCustomSvgLayerProps<ChartSeries>["series"],
	yScale: LineCustomSvgLayerProps<ChartSeries>["yScale"],
) {
	const { area } = useChart();

	return (seriesIndex: number, pointIndex: number) => {
		if (!area) {
			const { y } = series[seriesIndex]!.data[pointIndex]!.position;
			return y - 12;
		}

		const point = series[seriesIndex]!.data[pointIndex]!.data;
		const y = point.y ?? 0;
		const height = point.value ?? 0;
		return yScale(y - height / 2);
	};
}
