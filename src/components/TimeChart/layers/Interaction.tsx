import type { LineCustomSvgLayerProps } from "@nivo/line";
import { isEqual } from "es-toolkit";
import { type MouseEvent, useEffect } from "react";
import { useGrab } from "@/components/RangeSlider";
import { useResize } from "@/components/Resizer";
import type { ChartSeries } from "../Chart";
import { useChart } from "../chartContext";
import { useChartZoom } from "../zoomContext";

export type InteractivePoint = { x: Date; seriesId: string };
type Props = LineCustomSvgLayerProps<ChartSeries>;

export const Interaction = (props: Props) => (
	<g data-interaction-layer>
		<rect
			width={props.innerWidth}
			height={props.innerHeight}
			opacity={0}
			{...useHover(props)}
		/>
		<ClipPath {...props} />
	</g>
);

function ClipPath({ innerWidth, innerHeight }: Props) {
	const { setChartHeight, setChartWidth, clipPathId } = useChartZoom();

	useEffect(() => setChartHeight(innerHeight), [setChartHeight, innerHeight]);
	useEffect(() => setChartWidth(innerWidth), [setChartWidth, innerWidth]);

	const padding = 8; // space for lines box-shadow and points
	return (
		<defs>
			<clipPath id={clipPathId}>
				<rect
					x={-padding}
					y={-padding}
					width={innerWidth + 2 * padding}
					height={innerHeight + 2 * padding}
				/>
			</clipPath>
		</defs>
	);
}

function useHover({ innerWidth, innerHeight, series, yScale }: Props) {
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

	const pointXs =
		series[0]?.data.map(({ position, data }) => ({
			data: data.x,
			position: position.x,
		})) ?? [];
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
	const proximityThreshold = (innerHeight + innerWidth) / 16;
	const getClosestPoint = (mouse: { x: number; y: number }) => {
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
