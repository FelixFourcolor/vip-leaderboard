import type { LineCustomSvgLayerProps } from "@nivo/line";
import type { MouseEvent } from "react";
import { useGrab } from "@/components/RangeSlider";
import { useResize } from "@/components/Resizer";
import type { ChartSeries } from "../Chart";
import { useChart } from "../context";

export type InteractivePoint = { x: Date; seriesId: string };

export const Interaction = ({
	innerWidth,
	innerHeight,
	series,
	yScale,
}: LineCustomSvgLayerProps<ChartSeries>) => (
	<rect
		width={innerWidth}
		height={innerHeight}
		opacity={0}
		{...useHover(series, yScale)}
	/>
);

function useHover(
	series: LineCustomSvgLayerProps<ChartSeries>["series"],
	yScale: LineCustomSvgLayerProps<ChartSeries>["yScale"],
) {
	const { isGrabbing } = useGrab();
	const { isResizing } = useResize();
	const { setActiveSeries, setHoveredPoint, area, ranked } = useChart();

	const focus = (point: InteractivePoint) => {
		setActiveSeries(point.seriesId);
		setHoveredPoint(point);
	};
	const unfocus = () => {
		setActiveSeries(undefined);
		setHoveredPoint(undefined);
	};

	const getHoveredArea = (mouse: { x: number; y: number }) => {
		const xPoints = series[0]!.data.map(({ position, data }) => ({
			data: data.x,
			position: position.x,
		}));

		// 1. Find closest X
		const { index: pointIndex } = xPoints.reduce(
			(best, { position }, index) => {
				const dist = Math.abs(position - mouse.x);
				return dist < best.dist ? { dist, index } : best;
			},
			{ dist: Infinity, index: 0 },
		);

		// 2. Find which series the Y coordinate falls into
		const hoveredSeries = series.find(
			ranked
				? ({ data }) => {
						const point = data[pointIndex]!.data;
						const y = point.y ?? 0;
						const height = point.value ?? 0;
						return yScale(y) <= mouse.y && mouse.y <= yScale(y - height);
					}
				: ({ data }, seriesIndex) => {
						const thisY = data[pointIndex]!.position.y;
						const prevY =
							seriesIndex === 0
								? yScale(0)
								: series[seriesIndex - 1]!.data[pointIndex]!.position.y;
						return thisY <= mouse.y && mouse.y <= prevY;
					},
		);

		return hoveredSeries
			? { seriesId: hoveredSeries.id, x: xPoints[pointIndex]!.data }
			: null;
	};
	const getClosestPoint = (mouse: { x: number; y: number }) => {
		const points = series.flatMap(({ data: seriesData, id: seriesId }) =>
			seriesData
				.filter(({ data }) => data.y)
				.map(({ data, position }) => ({ data, position, seriesId })),
		);

		const { point } = points.reduce(
			(best, { position, data, seriesId }) => {
				const dist = Math.hypot(position.x - mouse.x, position.y - mouse.y);
				return dist < best.dist
					? { point: { seriesId, x: data.x }, dist }
					: best;
			},
			{ point: null as InteractivePoint | null, dist: Infinity },
		);
		return point;
	};

	const onMouseMove = ({ currentTarget, clientX, clientY }: MouseEvent) => {
		if (isGrabbing || isResizing) {
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
	return { onMouseMove, onMouseLeave: unfocus };
}
