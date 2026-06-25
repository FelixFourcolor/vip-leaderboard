import { isEqual } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { useChart } from "../../chartContext";
import { useChartZoom, type ZoomContextValue } from "../../zoomContext";

export function usePanHandler() {
	const { ranked, area } = useChart();
	const reverse = ranked && !area;

	const { xValues, yRange, setXZoom, setYZoom } = useChartZoom();
	const xLength = xValues.length;
	const yLength = yRange.max - yRange.min + 1;

	const panX = useMemo(
		() => createPanHandler(setXZoom, xLength),
		[setXZoom, xLength],
	);
	const panY = useMemo(
		() => createPanHandler(setYZoom, yLength),
		[setYZoom, yLength],
	);

	return useCallback(
		(deltaX: number, deltaY: number) => {
			panX(deltaX);
			panY((reverse ? -1 : 1) * deltaY);
		},
		[panX, panY, reverse],
	);
}

const createPanHandler =
	(setValue: ZoomContextValue["setXZoom"], length: number) => (delta: number) =>
		setValue((current) => {
			const [startOffset, endOffset] = current;
			const zoomLevel = startOffset + endOffset;
			const scaldedDelta = delta * (length - zoomLevel);

			const newValue = ((): typeof current => {
				const newStartOffset = startOffset + scaldedDelta;
				const newEndOffset = endOffset - scaldedDelta;
				if (newStartOffset < 0) {
					return [0, zoomLevel];
				}
				if (newEndOffset < 0) {
					return [zoomLevel, 0];
				}
				return [newStartOffset, newEndOffset];
			})();
			return isEqual(current, newValue) ? current : newValue;
		});
