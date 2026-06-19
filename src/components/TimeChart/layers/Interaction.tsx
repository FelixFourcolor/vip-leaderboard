import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { isEqual, throttle } from "es-toolkit";
import {
	type MouseEvent,
	useCallback,
	useEffect,
	useEffectEvent,
	useMemo,
	useRef,
	useState,
} from "react";
import { useDrag } from "@/hooks/useDrag";
import type { XY } from "@/utils/types";
import type { ChartSeries } from "../Chart";
import { useChart } from "../chartContext";
import styles from "../TimeChart.module.css";
import { useChartZoom, type ZoomContextValue } from "../zoomContext";

const cx = classNames.bind(styles);

export type InteractivePoint = { x: Date; seriesId: string };
type Props = LineCustomSvgLayerProps<ChartSeries>;

export function Interaction(props: Props) {
	const { isInteracting, isZoomed } = useChartZoom();

	const [boundRect = { x: 0, y: 0 }, setBoundRect] = useState<XY>();
	const gRef = useRef<SVGGElement | null>(null);
	useEffect(() => {
		setBoundRect(gRef.current?.getBoundingClientRect());
	}, []);

	const { onHover, onUnhover } = useHover(props);
	const { onWheel, onPanStart } = useZoom();
	const { selection, onSelectStart, isSelecting } = useSelect(boundRect);

	const rectRef = useRef<SVGRectElement | null>(null);
	const onWheelEvent = useEffectEvent((e: WheelEvent) => {
		onUnhover();
		onWheel(e);
	});

	useEffect(() => {
		// React native event doesn't let you do `e.preventDefault()`
		rectRef.current?.addEventListener("wheel", onWheelEvent);
		return () => rectRef.current?.removeEventListener("wheel", onWheelEvent);
	}, []);

	return (
		<g data-interaction-layer ref={gRef}>
			<rect
				x={-PADDING}
				y={-PADDING}
				width={props.innerWidth + 2 * PADDING}
				height={props.innerHeight + 2 * PADDING}
				opacity={0}
				ref={rectRef}
				onMouseDown={(e) => {
					onUnhover();
					if (e.buttons === 1) {
						// left click
						onSelectStart(e);
					} else if (isZoomed) {
						onPanStart(e);
					}
				}}
				onContextMenu={(e) => {
					if (isZoomed) {
						e.preventDefault();
					}
				}}
				onMouseMove={(e) => {
					if (!isInteracting && !isSelecting) {
						onHover(e);
					}
				}}
				onMouseLeave={onUnhover}
			/>
			{selection && <SelectionOverlay {...selection} />}
			<ClipPath {...props} />
		</g>
	);
}

const PADDING = 8; // space for lines box-shadow and points

function ClipPath({ innerWidth, innerHeight }: Props) {
	const { setChartHeight, setChartWidth, clipPathId } = useChartZoom();

	useEffect(() => setChartHeight(innerHeight), [setChartHeight, innerHeight]);
	useEffect(() => setChartWidth(innerWidth), [setChartWidth, innerWidth]);

	return (
		<defs>
			<clipPath id={clipPathId}>
				<rect
					x={-PADDING}
					y={-PADDING}
					width={innerWidth + 2 * PADDING}
					height={innerHeight + 2 * PADDING}
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

type Selection = { start: XY; current: XY };
function SelectionOverlay({ start, current }: Selection) {
	const margin = 1;
	return (
		<rect
			className={cx("selection-overlay")}
			x={Math.min(start.x, current.x) - margin}
			y={Math.min(start.y, current.y) - margin}
			width={Math.abs(current.x - start.x) + 2 * margin}
			height={Math.abs(current.y - start.y) + 2 * margin}
		/>
	);
}

function useSelect(boundRect: XY) {
	const { ranked, area } = useChart();
	const reverse = ranked && !area;

	const {
		chartWidth = Infinity,
		chartHeight = Infinity,
		xValues,
		yRange,
		setXZoom,
		setYZoom,
	} = useChartZoom();

	const [selection, setSelection] = useState<Selection>();
	const clampedSelection = useMemo(() => {
		if (!selection) {
			return;
		}
		return {
			start: selection.start,
			current: {
				x: Math.min(Math.max(selection.current.x, 0), chartWidth),
				y: Math.min(Math.max(selection.current.y, 0), chartHeight),
			},
		};
	}, [chartWidth, chartHeight, selection]);

	const onSelectStart = (e: MouseEvent) => {
		const pos = {
			x: e.clientX - boundRect.x,
			y: e.clientY - boundRect.y,
		};
		setSelection({ start: pos, current: pos });
		onMouseDown(e);
	};
	const onSelecting = ({ x, y }: XY) => {
		setSelection((prev) => {
			if (!prev) {
				return;
			}
			return {
				start: prev.start,
				current: {
					x: prev.current.x + x,
					y: prev.current.y + y,
				},
			};
		});
	};
	const onApplySelection = () => {
		if (!clampedSelection) {
			return;
		}
		const { start, current } = clampedSelection;

		const x1 = Math.min(start.x, current.x) / chartWidth;
		const x2 = Math.max(start.x, current.x) / chartWidth;
		const y1 = Math.min(start.y, current.y) / chartHeight;
		const y2 = Math.max(start.y, current.y) / chartHeight;

		const xLength = xValues.length;
		const yLength = yRange.max - yRange.min + 1;

		setXZoom(([start, end]) => {
			const zoomedLength = xLength - (start + end);

			const newStart = start + x1 * zoomedLength;
			const newEnd = end + (1 - x2) * zoomedLength;

			if (newStart + newEnd > Math.min(0.9 * xLength, xLength - 1)) {
				return [start, end];
			}
			return [newStart, newEnd];
		});

		setYZoom(([start, end]) => {
			const zoomedLength = yLength - (start + end);

			const [newStart, newEnd] = (() => {
				if (reverse) {
					const newStart = start + y1 * zoomedLength;
					const newEnd = end + (1 - y2) * zoomedLength;
					return [newStart, newEnd];
				}
				const newStart = start + (1 - y2) * zoomedLength;
				const newEnd = end + y1 * zoomedLength;
				return [newStart, newEnd];
			})();

			if (newStart + newEnd > Math.min(0.9 * yLength, yLength - 1)) {
				return [start, end];
			}
			return [newStart, newEnd];
		});

		setSelection(undefined);
	};
	const { onMouseDown, isDragging } = useDrag(
		"grab",
		onSelecting,
		onApplySelection,
	);

	return {
		selection: clampedSelection,
		onSelectStart,
		isSelecting: isDragging,
	};
}

function useZoom() {
	const { ranked, area } = useChart();
	const reverse = ranked && !area;

	const { xValues, yRange, setXZoom, setYZoom, setIsInteracting } =
		useChartZoom();

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
	const onWheel = (e: WheelEvent) => {
		e.preventDefault();
		if (e.ctrlKey) {
			throttledZoom(-Math.sign(e.deltaY));
		} else {
			throttledPan(xUnit * Math.sign(e.deltaX), -yUnit * Math.sign(e.deltaY));
		}
		clearTimeout(wheelTimeout.current);
		setIsInteracting(true);
		wheelTimeout.current = setTimeout(() => setIsInteracting(false), 100);
	};

	const onPanStart = (e: MouseEvent) => {
		onMouseDown(e);
		setIsInteracting(true);
	};
	const onPan = ({ x, y }: XY) => {
		pan(-x * xScale, y * yScale);
	};
	const onPanEnd = () => {
		setIsInteracting(false);
	};
	const { onMouseDown } = useDrag("grab", onPan, onPanEnd);

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
				const available = 0.9 * length - startOffset - endOffset;
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
		const throttledF = throttle(f, 16, { edges: ["leading"] });
		throttledRef.current = throttledF as any as F;
		return () => throttledF.cancel();
	}, [f]);

	return throttledRef.current;
}
