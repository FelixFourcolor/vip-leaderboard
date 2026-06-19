import { throttle } from "es-toolkit";
import { useEffect, useRef } from "react";
import { useChartZoom } from "../../zoomContext";
import { usePanHandler } from "./pan";
import { useZoomHandler } from "./zoom";

export function useWheel() {
	const { xValues, yRange, setIsInteracting } = useChartZoom();

	const xLength = xValues.length;
	const yLength = yRange.max - yRange.min + 1;
	const xUnit = xLength / 24;
	const yUnit = yLength / 24;

	const pan = useThrottle(usePanHandler());
	const zoom = useThrottle(useZoomHandler());
	const timeoutRef = useRef<number>(undefined);

	return (e: WheelEvent) => {
		e.preventDefault();
		if (e.ctrlKey) {
			const direction = -Math.sign(e.deltaY);
			zoom(xUnit * direction, yUnit * direction);
		} else {
			pan(xUnit * Math.sign(e.deltaX), -yUnit * Math.sign(e.deltaY));
		}
		clearTimeout(timeoutRef.current);
		setIsInteracting(true);
		timeoutRef.current = setTimeout(() => setIsInteracting(false), 100);
	};
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
