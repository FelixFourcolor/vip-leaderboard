import type { MouseEvent } from "react";
import { useDrag as useDragGlobal } from "@/hooks/useDrag";
import type { XY } from "@/utils/types";
import { useChartZoom } from "../../zoomContext";
import { usePanHandler } from "./pan";

export function useDrag() {
	const { setIsInteracting } = useChartZoom();
	const pan = usePanHandler();

	const onDrag = ({ x, y }: XY) => {
		pan(-x / innerWidth, y / innerHeight);
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
