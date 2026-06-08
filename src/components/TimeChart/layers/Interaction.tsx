import type { LineCustomSvgLayerProps } from "@nivo/line";
import { isEqual } from "es-toolkit";
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
	const { setActiveSeries, setHoveredPoint, area } = useChart();

	const focus = (point: InteractivePoint) => {
		setActiveSeries(point.seriesId);
		setHoveredPoint((current) => (isEqual(current, point) ? current : point));
	};
	const unfocus = () => {
		setActiveSeries(undefined);
		setHoveredPoint(undefined);
	};

	const pointXs = series[0]!.data.map(({ position, data }) => ({
		data: data.x,
		position: position.x,
	}));
	const getHoveredArea = (mouse: { x: number; y: number }) => {
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
	const getClosestPoint = (mouse: { x: number; y: number }) => {
		type Accumulator = { dist: number; point?: InteractivePoint };
		const { point } = allPoints.reduce<Accumulator>(
			(best, { position, data, seriesId }) => {
				const dist = Math.hypot(position.x - mouse.x, position.y - mouse.y);
				return dist < best.dist
					? { point: { seriesId, x: data.x }, dist }
					: best;
			},
			{ dist: Infinity },
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
