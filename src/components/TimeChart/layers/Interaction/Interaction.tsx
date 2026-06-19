import type { LineCustomSvgLayerProps } from "@nivo/line";
import classNames from "classnames/bind";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { XY } from "@/utils/types";
import type { ChartSeries } from "../../Chart";
import styles from "../../TimeChart.module.css";
import { useChartZoom } from "../../zoomContext";
import { useDrag } from "./drag";
import { useHover } from "./hover";
import type { Selection } from "./select";
import { useSelect } from "./select";
import { useWheel } from "./wheel";

const cx = classNames.bind(styles);

type Props = LineCustomSvgLayerProps<ChartSeries>;

export function Interaction(props: Props) {
	const { isInteracting, isZoomed } = useChartZoom();

	const [boundRect = { x: 0, y: 0 }, setBoundRect] = useState<XY>();
	const gRef = useRef<SVGGElement | null>(null);
	useEffect(() => {
		setBoundRect(gRef.current?.getBoundingClientRect());
	}, []);

	const { onHover, onUnhover } = useHover(props);
	const onWheel = useWheel();
	const onDragStart = useDrag();
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
						onDragStart(e);
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
			<ZoomClipPath {...props} />
			{selection && <SelectOverlay {...selection} />}
		</g>
	);
}

const PADDING = 8; // space for lines box-shadow and points
function ZoomClipPath({ innerWidth, innerHeight }: Props) {
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

const MARGIN = 1;
const SelectOverlay = ({ start, current }: Selection) => (
	<rect
		className={cx("selection-overlay")}
		x={Math.min(start.x, current.x) - MARGIN}
		y={Math.min(start.y, current.y) - MARGIN}
		width={Math.abs(current.x - start.x) + 2 * MARGIN}
		height={Math.abs(current.y - start.y) + 2 * MARGIN}
	/>
);
