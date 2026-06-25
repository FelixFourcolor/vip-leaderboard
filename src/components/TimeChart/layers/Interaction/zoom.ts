import { isEqual } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { useChartZoom, type ZoomContextValue } from "../../zoomContext";

export function useZoomHandler() {
	const { xValues, yRange, setXZoom, setYZoom } = useChartZoom();
	const xLength = xValues.length;
	const yLength = yRange.max - yRange.min + 1;

	const zoomX = useMemo(
		() => createZoomHandler(setXZoom, xLength),
		[setXZoom, xLength],
	);
	const zoomY = useMemo(
		() => createZoomHandler(setYZoom, yLength),
		[setYZoom, yLength],
	);

	return useCallback(
		(x: number, y: number) => {
			zoomX(x);
			zoomY(y);
		},
		[zoomX, zoomY],
	);
}

const createZoomHandler =
	(setValue: ZoomContextValue["setXZoom"], length: number) =>
	(delta: number) => {
		delta *= length;
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
		});
	};
