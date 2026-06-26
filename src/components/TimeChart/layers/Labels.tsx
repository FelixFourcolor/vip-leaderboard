import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { useEffect, useMemo, useState } from "react";
import { windowed3 } from "@/utils/array";
import { monthsInRange } from "@/utils/time";
import type { XY } from "@/utils/types";
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
			{series.map(({ id, data }, seriesIndex) =>
				data.map(({ position, data }, pointIndex) => {
					if (shouldShowLabel(id, pointIndex, data)) {
						return (
							<Label
								key={`${id}-${data.x}`}
								seriesId={id}
								data={data}
								position={{
									x: position.x,
									y: getYPosition(seriesIndex, pointIndex),
								}}
							/>
						);
					}
				}),
			)}
		</g>
	);
}

type LabelProps = {
	seriesId: string;
	position: XY;
	data: ChartPoint;
};
function Label({ seriesId, data, position }: LabelProps) {
	const { area, isPointHovered } = useChart();
	const { chartHeight = Infinity } = useChartZoom();
	const offset = area ? -4 : 12;
	const visible = position.y + offset <= chartHeight;

	const [showRank, setShowRank] = useState(!!data.rank);
	useEffect(() => {
		if (!data.rank || !visible) {
			return;
		}
		const timer = setInterval(() => setShowRank((current) => !current), 1000);
		return () => clearInterval(timer);
	}, [data.rank, visible]);

	if (!visible) {
		return;
	}

	return (
		<>
			{area && isPointHovered({ x: data.x, seriesId }) && (
				<circle
					transform={`translate(${position.x},${position.y})`}
					className={cx("label-background")}
				/>
			)}
			<text className={cx("label")} {...position}>
				{showRank ? `#${data.rank}` : data.value}
			</text>
		</>
	);
}

function useVisibility() {
	const {
		cumulative,
		area,
		since,
		chartData,
		isHighlighted,
		isPointHovered,
		PointTooltip,
	} = useChart();
	const { xValues, xZoom } = useChartZoom();

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

	const idxZoomOffset = useMemo(() => {
		const firstMonth = xValues[0];
		if (!firstMonth) {
			return 0;
		}
		return monthsInRange(since, firstMonth).length - 1;
	}, [since, xValues[0]]);

	const labelSet = useMemo(() => {
		if (!chartData) {
			return;
		}

		const xLength = xValues.length;
		const zoomFirstIdx = Math.ceil(xZoom[0]);
		const zoomLastIdx = Math.floor(xLength - 1 - xZoom[1]);
		const zoomXLength = xValues.slice(zoomFirstIdx, zoomLastIdx + 1).length;
		const labelsCount = cumulative ? 10 : 16;
		const labelInterval = Math.max(1, Math.ceil(zoomXLength / labelsCount));

		const isIndexVisible = (i: number) => {
			i -= idxZoomOffset;
			return zoomFirstIdx <= i && i <= zoomLastIdx;
		};

		const isIntervalIndex = (i: number, seriesId: string) => {
			i -= idxZoomOffset;
			const lastIdx = Math.min(
				(() => {
					const lastNonNullIdx = lastNonNullIdxMap?.[seriesId];
					if (!lastNonNullIdx) {
						return xLength - 1;
					}
					return lastNonNullIdx - idxZoomOffset;
				})(),
				zoomLastIdx,
			);
			// reverse to show label at the end (later is more important)
			return (lastIdx - i) % labelInterval === 0;
		};

		return Object.fromEntries(
			chartData.map(({ id, data }) => {
				const labelIndices = new Set<number>();
				// add indices that fall into the interval
				data.forEach((_, i) => {
					if (isIndexVisible(i) && isIntervalIndex(i, id)) {
						labelIndices.add(i);
					}
				});
				// ensure each continuous segment has at least one label
				let segmentHasLabel = false;
				windowed3(data).forEach(([prev, curr, next], i) => {
					if (!isIndexVisible(i)) {
						return;
					}

					const isSegmentStart = (!isIndexVisible(i - 1) || !prev?.y) && curr.y;
					if (isSegmentStart) {
						segmentHasLabel = labelIndices.has(i);
					} else {
						segmentHasLabel ||= labelIndices.has(i);
					}

					if (!segmentHasLabel) {
						const isSegmentEnd = curr.y && (!next?.y || !isIndexVisible(i + 1));
						if (isSegmentEnd) {
							labelIndices.add(i);
						}
					}
				});
				return [id, labelIndices];
			}),
		);
	}, [chartData, cumulative, idxZoomOffset, lastNonNullIdxMap, xZoom, xValues]);

	return (seriesId: string, index: number, { x, value }: ChartPoint) => {
		if (!value || !isHighlighted(seriesId)) {
			return false;
		}
		const shouldHaveLabel = labelSet?.[seriesId]?.has(index);
		return area
			? shouldHaveLabel || isPointHovered({ seriesId, x })
			: shouldHaveLabel && (!PointTooltip || !isPointHovered({ seriesId, x }));
	};
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
