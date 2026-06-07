import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { useEffect, useMemo, useState } from "react";
import type { ChartPoint, ChartSeries } from "../Chart";
import { useChart } from "../context";
import styles from "../TimeChart.module.css";

const cx = classNames.bind(styles);

export function Labels({
	series,
	innerHeight,
	yScale,
}: LineCustomSvgLayerProps<ChartSeries>) {
	const shouldShowLabel = useVisibility();
	const getYPosition = useYPosition(series, innerHeight, yScale);

	return (
		<g>
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
		xValues,
		cumulative,
		area,
		chartData,
		isPointIsolated,
		isHighlighted,
		isPointHovered,
		PointTooltip,
	} = useChart();

	const lastIndex = useMemo(() => {
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
	const labelInterval = Math.max(1, Math.ceil(xValues.length / labelsCount));
	const isLabelIndex = (i: number, seriesId: string) =>
		// reversed to show label at the end
		(-i + (lastIndex?.[seriesId] ?? xValues.length - 1)) % labelInterval === 0;

	return (seriesId: string, index: number, { x, y }: ChartPoint) =>
		y &&
		isHighlighted(seriesId) &&
		(area || !PointTooltip || !isPointHovered({ seriesId, x })) &&
		(isLabelIndex(index, seriesId) || isPointIsolated({ seriesId, x }));
}

function useYPosition(
	series: LineCustomSvgLayerProps<ChartSeries>["series"],
	innerHeight: number,
	yScale: (y: number | null) => number,
) {
	const { area, ranked } = useChart();

	return (seriesIndex: number, pointIndex: number) => {
		if (ranked && area) {
			const point = series[seriesIndex]!.data[pointIndex]!.data;
			const y = point.y ?? 0;
			const height = point.value ?? 0;
			return yScale(y - height / 2);
		}

		const y1 = series[seriesIndex]!.data[pointIndex]!.position.y;
		if (!area) {
			return y1 - 12;
		}

		const y0 =
			seriesIndex === 0
				? innerHeight
				: series[seriesIndex - 1]!.data[pointIndex]!.position.y;
		return (y1 + y0) / 2;
	};
}
