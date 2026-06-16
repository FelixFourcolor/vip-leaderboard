import type { LineCustomSvgLayerProps } from "@nivo/line";
import { isEqual, throttle } from "es-toolkit";
import {
	type MouseEvent,
	useCallback,
	useEffect,
	useEffectEvent,
	useRef,
} from "react";
import { useDrag } from "@/hooks/useDrag";
import type { XY } from "@/utils/types";
import type { ChartSeries } from "../Chart";
import { useChart } from "../chartContext";
import { useChartZoom, type ZoomContextValue } from "../zoomContext";

export type InteractivePoint = { x: Date; seriesId: string };
type Props = LineCustomSvgLayerProps<ChartSeries>;

export function Interaction(props: Props) {
	const { onHover, onUnhover } = useHover(props);
	const { onWheel, onPanStart } = useZoom(onUnhover);
	const { isInteracting } = useChartZoom();

	const ref = useRef<SVGRectElement | null>(null);
	useEffect(() => {
		// React native event doesn't let you do `e.preventDefault()`
		ref.current?.addEventListener("wheel", onWheel);
		return () => ref.current?.removeEventListener("wheel", onWheel);
	}, [onWheel]);

	return (
		<g data-interaction-layer>
			<rect
				width={props.innerWidth}
				height={props.innerHeight}
				opacity={0}
				ref={ref}
				onMouseDown={(e) => {
					if (e.buttons !== 2) {
						// not right click
						onPanStart(e);
					}
				}}
				onMouseMove={(e) => {
					if (!isInteracting) {
						onHover(e);
					}
				}}
				onMouseLeave={onUnhover}
			/>
			<ClipPath {...props} />
		</g>
	);
}

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
	const { isDragging } = useDrag();
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
		if (isDragging) {
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

function useZoom(onInteract: () => void) {
	const { ranked, area } = useChart();
	const reverse = ranked && !area;

	const {
		xValues,
		yRange,
		xZoom,
		yZoom,
		setXZoom,
		setYZoom,
		setIsInteracting,
	} = useChartZoom();

	const xLength = xValues.length;
	const yLength = yRange.max - yRange.min + 1;
	const xUnit = xLength / 24;
	const yUnit = yLength / 24;
	const xScale = xLength / innerWidth;
	const yScale = yLength / innerHeight;

	const panX = usePanHandler(setXZoom);
	const panY = usePanHandler(setYZoom);
	const pan = useCallback(
		(deltaX: number, deltaY: number) => {
			panX(deltaX);
			panY((reverse ? -1 : 1) * deltaY);
		},
		[panX, panY, reverse],
	);
	const throttledPan = useThrottle(pan);

	const zoomX = useZoomHandler(setXZoom, xLength);
	const zoomY = useZoomHandler(setYZoom, yLength);
	const throttledZoom = useThrottle(
		useCallback(
			(delta: number) => {
				zoomX(xUnit * delta);
				zoomY(yUnit * delta);
			},
			[zoomX, zoomY, xUnit, yUnit],
		),
	);

	const wheelTimeout = useRef<number | undefined>(undefined);
	const onWheel = useEffectEvent((e: WheelEvent) => {
		e.preventDefault();
		if (e.ctrlKey) {
			throttledZoom(-Math.sign(e.deltaY));
		} else {
			throttledPan(xUnit * Math.sign(e.deltaX), -yUnit * Math.sign(e.deltaY));
		}
		clearTimeout(wheelTimeout.current);
		setIsInteracting(true);
		onInteract();
		wheelTimeout.current = setTimeout(() => setIsInteracting(false), 100);
	});

	const isZoomed = xZoom.some(Boolean) || yZoom.some(Boolean);
	const onPanStart = (e: MouseEvent) => {
		if (isZoomed) {
			onInteract();
			onMouseDown(e);
			setIsInteracting(true);
		}
	};
	const onDrag = ({ x, y }: XY) => {
		pan(-x * xScale, y * yScale);
	};
	const onDragEnd = () => {
		setIsInteracting(false);
	};
	const { onMouseDown } = useDrag("grab", onDrag, onDragEnd);

	return { onWheel, onPanStart };
}

function useZoomHandler(
	setValue: ZoomContextValue["setXZoom"],
	length: number,
) {
	return useCallback(
		(delta: number) =>
			setValue((current) => {
				const [startOffset, endOffset] = current;
				const available = length - 3 - startOffset - endOffset;
				if (delta > 0) {
					delta = Math.min(delta, Math.floor(available / 2));
				}
				const newValue: typeof current = [
					Math.max(startOffset + delta, 0),
					Math.max(endOffset + delta, 0),
				];
				return isEqual(current, newValue) ? current : newValue;
			}),
		[setValue, length],
	);
}

function usePanHandler(setValue: ZoomContextValue["setXZoom"]) {
	return useCallback(
		(delta: number) =>
			setValue((current) => {
				const [startOffset, endOffset] = current;
				const zoomLevel = startOffset + endOffset;
				const newValue = ((): typeof current => {
					const newStartOffset = startOffset + delta;
					const newEndOffset = endOffset - delta;
					if (newStartOffset < 0) {
						return [0, zoomLevel];
					}
					if (newEndOffset < 0) {
						return [zoomLevel, 0];
					}
					return [newStartOffset, newEndOffset];
				})();
				return isEqual(current, newValue) ? current : newValue;
			}),
		[setValue],
	);
}

function useThrottle<F extends (...args: any[]) => void>(f: F) {
	const throttledRef = useRef(f);
	useEffect(() => {
		const throttledF = throttle(f, 24, { edges: ["leading"] });
		throttledRef.current = throttledF as any as F;
		return () => throttledF.cancel();
	}, [f]);

	return throttledRef.current;
}
