import { throttle } from "es-toolkit";
import { useEffect, useRef } from "react";
import { useChartZoom } from "../../zoomContext";
import { usePanHandler } from "./pan";
import { useZoomHandler } from "./zoom";

export function useWheel() {
	const { setIsInteracting } = useChartZoom();
	const pan = useThrottle(usePanHandler());
	const zoom = useThrottle(useZoomHandler());
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

function useThrottle<F extends (...args: any[]) => void>(f: F) {
	const throttledRef = useRef(f);

	useEffect(() => {
		const throttledF = throttle(f, 12, { edges: ["leading"] });
		throttledRef.current = throttledF as any as F;
		return () => throttledF.cancel();
	}, [f]);

	return throttledRef.current;
}
