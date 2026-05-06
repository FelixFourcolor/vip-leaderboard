import type { LineCustomSvgLayerProps } from "@nivo/line";
import { useCallback, useMemo } from "react";
import type { ChartDataPoint, ChartSeries } from "../Chart";
import { useChartControls } from "../Controls";
import { type PointId, useChart } from "../context";

type Position = { x: number; y: number };
type Point = { data: ChartDataPoint; position: Position; seriesId: string };
type XPoint = { data: ChartDataPoint["x"]; position: Position["x"] };

export function ChartInteraction({
	innerWidth,
	innerHeight,
	series,
	yScale,
}: LineCustomSvgLayerProps<ChartSeries>) {
	const { setHighlightedUser, setHoveredPoint } = useChart();
	const [{ stacked }] = useChartControls();

	const points = useMemo(() => {
		if (stacked) {
			return [];
		}

		const points: Array<Point> = [];
		for (const { data: seriesData, id: seriesId } of series) {
			for (const { data, position } of seriesData) {
				if (data.y) {
					points.push({ data, position, seriesId });
				}
			}
		}
		return points;
	}, [series, stacked]);

	const xPoints = useMemo(() => {
		if (!stacked) {
			return [];
		}

		return series[0]!.data.map(({ position, data }) => ({
			position: position.x,
			data: data.x,
		}));
	}, [series, stacked]);

	const handleMouseLeave = useCallback(() => {
		setHighlightedUser(undefined);
		setHoveredPoint(undefined);
	}, [setHighlightedUser, setHoveredPoint]);

	const handleMouseMove = useCallback(
		({ currentTarget, clientX, clientY }: React.MouseEvent<SVGRectElement>) => {
			const rect = currentTarget.getBoundingClientRect();
			const mouse: Position = { x: clientX - rect.left, y: clientY - rect.top };

			let result: PointId | null = null;
			if (!stacked) {
				result = getClosestPoint(mouse, points);
			} else {
				result = getHoveredStackedSeries(mouse, series, xPoints, yScale);
			}

			if (result) {
				setHighlightedUser(result.seriesId);
				setHoveredPoint(result);
			} else {
				handleMouseLeave();
			}
		},
		[
			stacked,
			points,
			series,
			xPoints,
			yScale,
			setHighlightedUser,
			setHoveredPoint,
			handleMouseLeave,
		],
	);

	return (
		<rect
			width={innerWidth}
			height={innerHeight}
			opacity={0}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		/>
	);
}

function getClosestPoint(
	mouse: Position,
	points: Array<Point>,
): PointId | null {
	let minDistance = Infinity;
	let closestPoint: PointId | null = null;

	for (const { position, data, seriesId } of points) {
		const distance = Math.hypot(position.x - mouse.x, position.y - mouse.y);
		if (distance < minDistance) {
			minDistance = distance;
			closestPoint = { seriesId, x: data.x };
		}
	}

	return closestPoint;
}

function getHoveredStackedSeries(
	mouse: Position,
	series: LineCustomSvgLayerProps<ChartSeries>["series"],
	xPoints: Array<XPoint>,
	yScale: LineCustomSvgLayerProps<ChartSeries>["yScale"],
): PointId | null {
	if (!series.length || xPoints.length === 0) return null;

	// 1. Find closest X
	let pointIndex = 0;
	let minDistanceX = Infinity;

	for (let i = 0; i < xPoints.length; i++) {
		const distance = Math.abs(xPoints[i]!.position - mouse.x);
		if (distance < minDistanceX) {
			minDistanceX = distance;
			pointIndex = i;
		}
	}

	const x = xPoints[pointIndex]!.data;

	// 2. Find which series the Y coordinate falls into
	let seriesId: string | null = null;

	for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
		const upperY = series[seriesIndex]!.data[pointIndex]!.position.y;
		const lowerY =
			seriesIndex === 0
				? yScale(0)
				: series[seriesIndex - 1]!.data[pointIndex]!.position.y;

		if (mouse.y <= lowerY && mouse.y >= upperY) {
			seriesId = series[seriesIndex]!.id;
			break;
		}
	}

	return seriesId ? { seriesId, x } : null;
}
