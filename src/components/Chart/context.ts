import { createContext, type Dispatch, use } from "react";
import type { MonthlyRanking } from "@/db/monthlyRanking";

interface ChartContextValue {
	chartData: MonthlyRanking;
	isolatedPoints: Record<string, Set<string>>;
	idByColor: Record<string, string>;
	visibleUsersCount: number;
	setVisibleUsersCount: Dispatch<number>;
	highlightedUser: string | undefined;
	setHighlightedUser: Dispatch<string | undefined>;
	hoveredPoint: { x: Date; y: number } | undefined;
	setHoveredPoint: Dispatch<{ x: Date; y: number } | undefined>;
}

export const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart() {
	const context = use(ChartContext);
	if (!context) {
		throw new Error("useChart must be used within ChartContext");
	}
	return context;
}
