import { useRef } from "react";
import { useThrottle } from "@/hooks/useThrottle";
import { useChartZoom } from "../../zoomContext";
import { usePanHandler } from "./pan";
import { useZoomHandler } from "./zoom";

const WHEEL_SPEED = 1 / 16;
const THROTTLE_MS = 24;

export function useWheel() {
	const { setIsInteracting } = useChartZoom();
	const pan = useThrottle(usePanHandler(), THROTTLE_MS);
	const zoom = useThrottle(useZoomHandler(), THROTTLE_MS);
	const timeoutRef = useRef<number>(undefined);

	return (e: WheelEvent) => {
		e.preventDefault();
		const { ctrlKey, deltaX, deltaY } = e;
		if (ctrlKey) {
			const direction = -Math.sign(deltaY);
			// speed / 2 because the ends move in opposite directions,
			// effectively doubling the rate
			const magnitude = (WHEEL_SPEED / 2) * direction;
			zoom(magnitude, magnitude);
		} else {
			pan(WHEEL_SPEED * Math.sign(deltaX), WHEEL_SPEED * -Math.sign(deltaY));
		}
		clearTimeout(timeoutRef.current);
		setIsInteracting(true);
		timeoutRef.current = setTimeout(() => setIsInteracting(false), 100);
	};
}
