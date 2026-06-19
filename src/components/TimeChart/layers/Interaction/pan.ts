import { isEqual } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { useChart } from "../../chartContext";
import { useChartZoom, type ZoomContextValue } from "../../zoomContext";

export function usePanHandler() {
	const { ranked, area } = useChart();
	const reverse = ranked && !area;

	const { setXZoom, setYZoom } = useChartZoom();

	const panX = useMemo(() => createPanHandler(setXZoom), [setXZoom]);
	const panY = useMemo(() => createPanHandler(setYZoom), [setYZoom]);

	return useCallback(
		(deltaX: number, deltaY: number) => {
			panX(deltaX);
			panY((reverse ? -1 : 1) * deltaY);
		},
		[panX, panY, reverse],
	);
}

const createPanHandler =
	(setValue: ZoomContextValue["setXZoom"]) => (delta: number) =>
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
		});
