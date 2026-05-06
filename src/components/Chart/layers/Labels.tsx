import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { useMemo } from "react";
import { getAnyValue } from "@/utils/object";
import { toYyyyMm } from "@/utils/time";
import type { ChartPoint, ChartSeries } from "../Chart";
import styles from "../Chart.module.css";
import { useChartControls } from "../Controls";
import { useChart } from "../context";

const cx = classNames.bind(styles);

export function ChartLabels({
	series,
	innerHeight,
}: LineCustomSvgLayerProps<ChartSeries>) {
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
	const [{ cumulative }] = useChartControls();
	const { chartData, isolatedPoints, highlightedUser } = useChart();

	const xLabels = useMemo(() => {
		const data = getAnyValue(chartData);
		if (!data) return [];
		return data.monthlyCount.map(({ month }) => month);
	}, [chartData]);

	const labelsCount = cumulative ? 10 : 20;
	const labelInterval = Math.max(1, Math.ceil(xLabels.length / labelsCount));

	return (id: string, index: number, point: ChartPoint) => {
		if (!point.y || highlightedUser !== id) {
			return false;
		}
		return (
			// reverse index to show labels for recent points
			(xLabels.length - 1 - index) % labelInterval === 0 ||
			// always show isolated points
			isolatedPoints[id]?.has(toYyyyMm(point.x))
		);
	};
}

function useYPosition() {
	const [{ stacked }] = useChartControls();

	return (
		series: LineCustomSvgLayerProps<ChartSeries>["series"],
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
