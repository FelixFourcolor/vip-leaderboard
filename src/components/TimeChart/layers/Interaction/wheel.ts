import { useRef } from "react";
import { useThrottle } from "@/hooks/useThrottle";
import { useChartZoom } from "../../zoomContext";
import { usePanHandler } from "./pan";
import { useZoomHandler } from "./zoom";

export function useWheel() {
	const { setIsInteracting } = useChartZoom();
	const pan = useThrottle(usePanHandler(), 12);
	const zoom = useThrottle(useZoomHandler(), 12);
	const timeoutRef = useRef<number>(undefined);

	return (e: WheelEvent) => {
		e.preventDefault();
		if (e.ctrlKey) {
			const direction = -Math.sign(e.deltaY);
			zoom(direction / 24, direction / 24);
		} else {
			pan(Math.sign(e.deltaX) / 16, -Math.sign(e.deltaY) / 16);
		}
		clearTimeout(timeoutRef.current);
		setIsInteracting(true);
		timeoutRef.current = setTimeout(() => setIsInteracting(false), 100);
	};
}
