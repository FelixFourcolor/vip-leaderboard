import type { LineCustomSvgLayerProps } from "@nivo/line";
import { useGrab } from "@/components/RangeSlider";
import { useResize } from "@/components/Resizer";
import type { ChartSeries } from "../Chart";
import { useChartControls } from "../Controls";
import { type PointId, useChart } from "../context";

export function ChartInteraction({
	innerWidth,
	innerHeight,
	series,
	yScale,
}: LineCustomSvgLayerProps<ChartSeries>) {
	const { setHighlightedUser, setHoveredPoint } = useChart();
	const [{ stacked }] = useChartControls();

	const { isGrabbing } = useGrab();
	const { isResizing } = useResize();

	const highlight = (point: PointId) => {
		setHighlightedUser(point.seriesId);
		setHoveredPoint(point);
	};

	const clearHighlight = () => {
		setHighlightedUser(undefined);
		setHoveredPoint(undefined);
	};

	return (
		<rect
			width={innerWidth}
			height={innerHeight}
			opacity={0}
			onMouseMove={({ currentTarget, clientX, clientY }) => {
				if (isGrabbing || isResizing) {
					return;
				}

				const rect = currentTarget.getBoundingClientRect();
				const mouse = { x: clientX - rect.left, y: clientY - rect.top };

				const result = stacked
					? getHoveredStackedSeries(mouse, series, yScale)
					: getClosestPoint(mouse, series);

				if (result) {
					highlight(result);
				} else {
					clearHighlight();
				}
			}}
			onMouseLeave={clearHighlight}
		/>
	);
}

type XY = { x: number; y: number };

function getClosestPoint(
	mouse: XY,
	series: LineCustomSvgLayerProps<ChartSeries>["series"],
): PointId | null {
	const points = series.flatMap(({ data: seriesData, id: seriesId }) =>
		seriesData
			.filter(({ data }) => data.y)
			.map(({ data, position }) => ({ data, position, seriesId })),
	);

	const { point } = points.reduce(
		(best, { position, data, seriesId }) => {
			const dist = Math.hypot(position.x - mouse.x, position.y - mouse.y);
			return dist < best.dist ? { point: { seriesId, x: data.x }, dist } : best;
		},
		{ point: null as PointId | null, dist: Infinity },
	);
	return point;
}

function getHoveredStackedSeries(
	mouse: XY,
	series: LineCustomSvgLayerProps<ChartSeries>["series"],
	yScale: LineCustomSvgLayerProps<ChartSeries>["yScale"],
): PointId | null {
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
	const hoveredSeries = series.find(({ data }, seriesIndex) => {
		const upperY = data[pointIndex]!.position.y;
		const lowerY =
			seriesIndex === 0
				? yScale(0)
				: series[seriesIndex - 1]!.data[pointIndex]!.position.y;

		return mouse.y <= lowerY && mouse.y >= upperY;
	});

	return hoveredSeries
		? {
				seriesId: hoveredSeries.id,
				x: xPoints[pointIndex]!.data,
			}
		: null;
}
