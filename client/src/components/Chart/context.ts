import { createContext, useContext } from "react";
import type { MonthlyData, RankingData } from "@/api/types";

interface ChartContextValue {
	monthlyData: MonthlyData;
	months: string[];
	userData: RankingData;
	isolatedPoints: Record<string, Set<string>>;
	colorById: Record<string, string>;
	idByColor: Record<string, string>;
	highlightedUser: string | null;
	hoveredPoint: { x: Date; y: number } | null;
}

export const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart() {
	const context = useContext(ChartContext);
	if (!context) {
		throw new Error("useChart must be used within a ChartContext.Provider");
	}
	return context;
}
