import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { monthsInRange, type YyyyMm } from "@/utils/time";
import type { Pair } from "@/utils/types";
import { useChart } from "./chartContext";
import { ZoomContext } from "./zoomContext";

export function ZoomProvider({ children }: { children?: ReactNode }) {
	const [chartHeight, setChartHeight] = useState<number>();
	const [chartWidth, setChartWidth] = useState<number>();

	const [xZoom, setXZoom] = useState<Readonly<Pair<number>>>([0, 0]);
	const [yZoom, setYZoom] = useState<Readonly<Pair<number>>>([0, 0]);
	const [isInteracting, setIsInteracting] = useState(false);

	const { since, until } = useChart();
	const xValues = useXValues(since, until);
	const yRange = useYRange();
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset zoom when range changes
	useEffect(() => {
		setXZoom([0, 0]);
	}, [xValues]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset zoom when range changes
	useEffect(() => {
		setYZoom([0, 0]);
	}, [yRange]);

	const clipPathId = useId();

	return (
		<ZoomContext
			value={{
				chartHeight,
				setChartHeight,
				chartWidth,
				setChartWidth,
				xZoom,
				setXZoom,
				yZoom,
				setYZoom,
				xValues,
				yRange,
				isInteracting,
				setIsInteracting,
				clipPathId,
			}}
		>
			{children}
		</ZoomContext>
	);
}

function useXValues(since: YyyyMm, until: YyyyMm) {
	const { chartData, area } = useChart();

	return useMemo(() => {
		const xValues = monthsInRange(since, until);
		if (!chartData?.length) {
			return xValues;
		}
		const sinceIndex = (() => {
			for (let i = 0; i < xValues.length; ++i) {
				for (const { data } of chartData) {
					const point = data[i]!;
					if (area ? point.value : point.y) {
						return i;
					}
				}
			}
			return 0;
		})();
		const untilIndex = (() => {
			for (let i = xValues.length; i--; ) {
				for (const { data } of chartData) {
					const point = data[i]!;
					if (area ? point.value : point.y) {
						return i;
					}
				}
			}
			return xValues.length - 1;
		})();
		return xValues.slice(sinceIndex, untilIndex + 1);
	}, [chartData, area, since, until]);
}

function useYRange() {
	const { chartData, cumulative, ranked, area } = useChart();

	return useMemo(() => {
		if (!chartData?.length) {
			return { min: Infinity, max: 0 };
		}

		// shortcut when data is already sorted on the x-axis
		if (cumulative && (!ranked || area)) {
			const min = (() => {
				if (area) {
					const { data } = chartData[chartData.length - 1]!;
					if (!data[0]) {
						return Infinity;
					}
					const { y, value } = data[0];
					return (y ?? value) - value;
				}
				return Math.min(
					...chartData.map(({ data }) => {
						for (const { y } of data) {
							if (y != null) {
								return y;
							}
						}
						return Infinity;
					}),
				);
			})();
			const max = (() => {
				const { data } = chartData[0]!;
				for (let i = data.length; i--; ) {
					const { y } = data[i]!;
					if (y != null) {
						return y;
					}
				}
				return 0;
			})();
			return { min, max };
		}

		// when data is already sorted on the y-axis
		if (area && !ranked) {
			const min = Math.min(
				...chartData[chartData.length - 1]!.data.map(({ y, value }) =>
					y == null ? Infinity : y - value,
				),
			);
			const max = Math.max(...chartData[0]!.data.map(({ y }) => y ?? 0), 0);
			return { min, max };
		}

		return chartData
			.flatMap((s) => s.data)
			.reduce(
				({ min, max }, { y, value }) => {
					if (y != null) {
						const yBottom = area ? y - value : y;
						if (yBottom < min) {
							min = yBottom;
						}
						if (y > max) {
							max = y;
						}
					}
					return { min, max };
				},
				{ min: Infinity, max: 0 },
			);
	}, [chartData, area, ranked, cumulative]);
}
