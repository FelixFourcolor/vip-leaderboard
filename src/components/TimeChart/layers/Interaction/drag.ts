import type { MouseEvent } from "react";
import { useDrag as useDragGlobal } from "@/hooks/useDrag";
import type { XY } from "@/utils/types";
import { useChartZoom } from "../../zoomContext";
import { usePanHandler } from "./pan";

export function useDrag() {
	const { xValues, yRange, setIsInteracting } = useChartZoom();
	
	const xLength = xValues.length;
	const yLength = yRange.max - yRange.min + 1;
	const xScale = xLength / innerWidth;
	const yScale = yLength / innerHeight;

	const pan = usePanHandler();

	const onDrag = ({ x, y }: XY) => {
		pan(-x * xScale, y * yScale);
	};
	const onDragEnd = () => {
		setIsInteracting(false);
	};
	const { onMouseDown } = useDragGlobal("grab", onDrag, onDragEnd);

	return (e: MouseEvent) => {
		onMouseDown(e);
		setIsInteracting(true);
	};
}
