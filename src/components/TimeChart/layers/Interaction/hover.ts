import type { LineCustomSvgLayerProps } from "@nivo/line";
import { isEqual } from "es-toolkit";
import type { MouseEvent } from "react";
import { useDrag } from "@/hooks/useDrag";
import type { XY } from "@/utils/types";
import type { ChartSeries } from "../../Chart";
import { useChart } from "../../chartContext";

export type InteractivePoint = { x: Date; seriesId: string };

export function useHover({
	innerWidth,
	innerHeight,
	series,
	yScale,
}: LineCustomSvgLayerProps<ChartSeries>) {
	const { isDragging } = useDrag();
	const { setActiveSeries, setHoveredPoint, area, enableHover } = useChart();

	const focus = (point: InteractivePoint) => {
		setActiveSeries(point.seriesId);
		setHoveredPoint((current) => (isEqual(current, point) ? current : point));
	};
	const unfocus = () => {
		setActiveSeries(undefined);
		setHoveredPoint(undefined);
	};

	const pointXs =
		series[0]?.data.map(({ position, data }) => ({
			data: data.x,
			position: position.x,
		})) ?? [];
	const getHoveredArea = (mouse: XY) => {
		const { index: pointIndex } = pointXs.reduce(
			(best, { position }, index) => {
				const dist = Math.abs(position - mouse.x);
				return dist < best.dist ? { dist, index } : best;
			},
			{ dist: Infinity, index: 0 },
		);
		const hoveredSeries = series.find(({ data }) => {
			const point = data[pointIndex]!.data;
			const y = point.y ?? 0;
			const height = point.value ?? 0;
			return yScale(y) <= mouse.y && mouse.y <= yScale(y - height);
		});
		return hoveredSeries
			? { seriesId: hoveredSeries.id, x: pointXs[pointIndex]!.data }
			: null;
	};

	const allPoints = series.flatMap(({ data: seriesData, id: seriesId }) =>
		seriesData
			.filter(({ data }) => data.y)
			.map(({ data, position }) => ({ data, position, seriesId })),
	);
	const proximityThreshold = (innerHeight + innerWidth) / 16;
	const getClosestPoint = (mouse: XY) => {
		type Accumulator = { dist: number; point?: InteractivePoint };
		const { dist, point } = allPoints.reduce<Accumulator>(
			(best, { position, data, seriesId }) => {
				const dist = Math.hypot(
					// prioritize points closwer on the x-axis
					2 * (position.x - mouse.x),
					position.y - mouse.y,
				);
				return dist < best.dist
					? { point: { seriesId, x: data.x }, dist }
					: best;
			},
			{ dist: Infinity },
		);
		if (dist < proximityThreshold) {
			return point;
		}
	};

	const onHover = ({ currentTarget, clientX, clientY }: MouseEvent) => {
		if (isDragging || !enableHover) {
			return;
		}

		const rect = currentTarget.getBoundingClientRect();
		const mouse = { x: clientX - rect.left, y: clientY - rect.top };
		const target = (area ? getHoveredArea : getClosestPoint)(mouse);

		if (target) {
			focus(target);
		} else {
			unfocus();
		}
	};
	return { onHover, onUnhover: unfocus };
}
