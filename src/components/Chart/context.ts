import { createContext, type Dispatch, use, useCallback } from "react";
import type { MonthlyRanking } from "@/db/monthlyRanking";
import { toYyyyMm, type YyyyMm } from "@/utils/time";

export type PointId = { x: Date; seriesId: string };

interface ChartContextValue {
	chartData: MonthlyRanking;
	isolatedPoints: Record<string, Set<YyyyMm>>;
	setStartingRank: Dispatch<number>;
	visibleRanks: number;
	setVisibleRanks: Dispatch<number>;
	highlightedUser: string | undefined;
	setHighlightedUser: Dispatch<string | undefined>;
	hoveredPoint: PointId | undefined;
	setHoveredPoint: Dispatch<PointId | undefined>;
}

export const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart() {
	const context = use(ChartContext);
	if (!context) {
		throw new Error("useChart must be used within ChartContext");
	}

	const { hoveredPoint, isolatedPoints, highlightedUser, ...rest } = context;

	const isPointHovered = useCallback(
		(point: PointId) =>
			hoveredPoint?.seriesId === point.seriesId &&
			hoveredPoint?.x.getTime() === point.x.getTime(),
		[hoveredPoint],
	);

	const isPointIsolated = useCallback(
		(point: PointId) => isolatedPoints[point.seriesId]?.has(toYyyyMm(point.x)),
		[isolatedPoints],
	);

	const isHighlighted = useCallback(
		(seriesId: string) => highlightedUser === seriesId,
		[highlightedUser],
	);

	const isMuted = useCallback(
		(seriesId: string) => highlightedUser && highlightedUser !== seriesId,
		[highlightedUser],
	);

	return {
		...rest,
		isPointHovered,
		isPointIsolated,
		highlightedUser,
		isHighlighted,
		isMuted,
	};
}
