import type { LineCustomSvgLayerProps } from "@nivo/line";
import { isEqual } from "es-toolkit";
import type { MouseEvent } from "react";
import { useDrag } from "@/hooks/useDrag";
import type { ChartSeries } from "../../Chart";
import { useChart } from "../../chartContext";

export type InteractivePoint = { x: Date; seriesId: string };

export function useHover({
	innerWidth,
	innerHeight,
	series,
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
	const getHoveredArea = (mouse: Mouse) => {
		const seriesId = document
			.elementsFromPoint(mouse.clientX, mouse.clientY)
			.find(
				(e): e is SVGElement => e instanceof SVGElement && !!e.dataset.seriesId,
			)?.dataset.seriesId;
		if (!seriesId) {
			return null;
		}

		const { index: pointIndex } = pointXs.reduce(
			(best, { position }, index) => {
				const dist = Math.abs(position - mouse.x);
				return dist < best.dist ? { dist, index } : best;
			},
			{ dist: Infinity, index: 0 },
		);
		return { seriesId, x: pointXs[pointIndex]!.data };
	};

	const allPoints = series.flatMap(({ data: seriesData, id: seriesId }) =>
		seriesData
			.filter(({ data }) => data.y)
			.map(({ data, position }) => ({ data, position, seriesId })),
	);
	const proximityThreshold = (innerHeight + innerWidth) / 16;
	const getClosestPoint = (mouse: Mouse) => {
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

	type Mouse = Record<"clientX" | "clientY" | "x" | "y", number>;

	const onHover = ({ currentTarget, clientX, clientY }: MouseEvent) => {
		if (isDragging || !enableHover) {
			return;
		}

		const rect = currentTarget.getBoundingClientRect();
		const mouse = {
			clientX,
			clientY,
			x: clientX - rect.left,
			y: clientY - rect.top,
		};
		const target = (area ? getHoveredArea : getClosestPoint)(mouse);

		if (target) {
			focus(target);
		} else {
			unfocus();
		}
	};
	return { onHover, onUnhover: unfocus };
}
