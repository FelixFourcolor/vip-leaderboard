import { type MouseEvent, useMemo, useState } from "react";
import { useDrag } from "@/hooks/useDrag";
import type { XY } from "@/utils/types";
import { useChart } from "../../chartContext";
import { useChartZoom } from "../../zoomContext";

export type Selection = { start: XY; current: XY };

export function useSelect(offset: XY) {
	const { ranked, area } = useChart();
	const reverse = ranked && !area;

	const {
		chartWidth = Infinity,
		chartHeight = Infinity,
		xValues,
		yRange,
		setXZoom,
		setYZoom,
	} = useChartZoom();

	const [selection, setSelection] = useState<Selection>();
	const clampedSelection = useMemo(() => {
		if (!selection) {
			return;
		}
		return {
			start: selection.start,
			current: {
				x: Math.min(Math.max(selection.current.x, 0), chartWidth),
				y: Math.min(Math.max(selection.current.y, 0), chartHeight),
			},
		};
	}, [chartWidth, chartHeight, selection]);

	const onSelectStart = (e: MouseEvent) => {
		const pos = {
			x: e.clientX - offset.x,
			y: e.clientY - offset.y,
		};
		setSelection({ start: pos, current: pos });
		onMouseDown(e);
	};
	const onSelecting = ({ x, y }: XY) => {
		setSelection((prev) => {
			if (!prev) {
				return;
			}
			return {
				start: prev.start,
				current: {
					x: prev.current.x + x,
					y: prev.current.y + y,
				},
			};
		});
	};
	const onApplySelection = () => {
		if (!clampedSelection) {
			return;
		}
		const { start, current } = clampedSelection;

		const x1 = Math.min(start.x, current.x) / chartWidth;
		const x2 = Math.max(start.x, current.x) / chartWidth;
		const y1 = Math.min(start.y, current.y) / chartHeight;
		const y2 = Math.max(start.y, current.y) / chartHeight;

		const xLength = xValues.length;
		const yLength = yRange.max - yRange.min + 1;

		setXZoom(([start, end]) => {
			const zoomedLength = xLength - (start + end);

			const newStart = start + x1 * zoomedLength;
			const newEnd = end + (1 - x2) * zoomedLength;

			if (newStart + newEnd > Math.min(0.9 * xLength, xLength - 1)) {
				return [start, end];
			}
			return [newStart, newEnd];
		});

		setYZoom(([start, end]) => {
			const zoomedLength = yLength - (start + end);

			const [newStart, newEnd] = (() => {
				if (reverse) {
					const newStart = start + y1 * zoomedLength;
					const newEnd = end + (1 - y2) * zoomedLength;
					return [newStart, newEnd];
				}
				const newStart = start + (1 - y2) * zoomedLength;
				const newEnd = end + y1 * zoomedLength;
				return [newStart, newEnd];
			})();

			if (newStart + newEnd > Math.min(0.9 * yLength, yLength - 1)) {
				return [start, end];
			}
			return [newStart, newEnd];
		});

		setSelection(undefined);
	};
	const { onMouseDown, isDragging } = useDrag(
		"grab",
		onSelecting,
		onApplySelection,
	);

	return {
		selection: clampedSelection,
		onSelectStart,
		isSelecting: isDragging,
	};
}
