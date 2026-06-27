import type { LineCustomSvgLayerProps } from "@nivo/line";
import { isEqual } from "es-toolkit";
import type { MouseEvent } from "react";
import { useDrag } from "@/hooks/useDrag";
import type { ChartSeries } from "../../Chart";
import { useChart } from "../../chartContext";

export type InteractivePoint = { x: Date; seriesId: string };

export function useHover({ series }: LineCustomSvgLayerProps<ChartSeries>) {
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

	type Mouse = Record<"clientX" | "clientY" | "x" | "y", number>;

	const getHoveredIds = (mouse: Mouse) =>
		document
			.elementsFromPoint(mouse.clientX, mouse.clientY)
			.filter((e) => e instanceof SVGElement)
			.map((e) => e.dataset.seriesId)
			.filter((seriesId) => seriesId !== undefined);

	const pointXs =
		series[0]?.data.map(({ position, data }) => ({
			data: data.x,
			position: position.x,
		})) ?? [];
	const getClosestX = (mouse: Mouse) =>
		pointXs.reduce(
			(best, { position }, index) => {
				const dist = Math.abs(position - mouse.x);
				return dist < best.dist ? { dist, index } : best;
			},
			{ dist: Infinity, index: 0 },
		).index;

	const getHoveredArea = (mouse: Mouse) => {
		const seriesId = getHoveredIds(mouse)[0];
		if (!seriesId) {
			return;
		}
		const xIndex = getClosestX(mouse);
		return { seriesId, x: pointXs[xIndex]!.data };
	};

	const getHoveredPoint = (mouse: Mouse) => {
		const hoveredIds = getHoveredIds(mouse);
		if (!hoveredIds.length) {
			return;
		}

		const xIndex = getClosestX(mouse);
		const x = pointXs[xIndex]!.data;
		if (hoveredIds.length === 1) {
			return { seriesId: hoveredIds[0]!, x: pointXs[xIndex]!.data };
		}

		const seriesId = series
			.filter(({ id }) => hoveredIds.includes(id))
			.reduce(
				(best, { id, data }) => {
					const y = data[xIndex]!.position.y;
					const dist = Math.abs(y - mouse.y);
					if (dist < best.dist) {
						return { id, dist };
					}
					return best;
				},
				{ id: hoveredIds[0]!, dist: Infinity },
			).id;
		return { seriesId, x };
	};

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
		const target = (area ? getHoveredArea : getHoveredPoint)(mouse);

		if (target) {
			focus(target);
		} else {
			unfocus();
		}
	};
	return { onHover, onUnhover: unfocus };
}
