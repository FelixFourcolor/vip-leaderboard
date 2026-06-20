import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { useEffect, useMemo, useState } from "react";
import { monthsInRange } from "@/utils/time";
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
function Label({ value, rank, x, y }: LabelProps) {
	const { area } = useChart();
	const { chartHeight = Infinity } = useChartZoom();
	const offset = area ? -4 : 12;
	const visible = y + offset <= chartHeight;

	const [showRank, setShowRank] = useState(!!rank);
	useEffect(() => {
		if (!rank || !visible) {
			return;
		}
		const timer = setInterval(() => setShowRank((current) => !current), 1000);
		return () => clearInterval(timer);
	}, [rank, visible]);

	if (visible) {
		return (
			<text x={x} y={y} className={cx("label")}>
				{showRank ? `#${rank}` : value}
			</text>
		);
	}
}

function useVisibility() {
	const {
		cumulative,
		area,
		since,
		chartData,
		isPointIsolated,
		isHighlighted,
		isPointHovered,
		PointTooltip,
	} = useChart();

	const lastNonNullIdxMap = useMemo(() => {
		if (!chartData || cumulative || area) {
			// when cumulative or area, last non-null index is always the last
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

	const { xValues, xZoom } = useChartZoom();
	const xLength = xValues.length;
	const zoomFirstIdx = Math.ceil(xZoom[0]);
	const zoomLastIdx = Math.floor(xLength - 1 - xZoom[1]);
	const zoomXLength = xValues.slice(zoomFirstIdx, zoomLastIdx + 1).length;

	const idxOffset = useMemo(() => {
		const firstMonth = xValues[0];
		if (!firstMonth) {
			return 0;
		}
		return monthsInRange(since, firstMonth).length - 1;
	}, [since, xValues[0]]);

	const labelsCount = cumulative ? 10 : 16;
	const labelInterval = Math.max(1, Math.ceil(zoomXLength / labelsCount));
	const isLabelIndex = (i: number, seriesId: string) => {
		i -= idxOffset;
		if (!(zoomFirstIdx <= i && i <= zoomLastIdx)) {
			return false;
		}
		const lastIdx = Math.min(
			(() => {
				const lastNonNullIdx = lastNonNullIdxMap?.[seriesId];
				if (!lastNonNullIdx) {
					return xLength - 1;
				}
				return lastNonNullIdx - idxOffset;
			})(),
			zoomLastIdx,
		);
		// reverse to show label at the end (later is more important)
		return (lastIdx - i) % labelInterval === 0;
	};

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
