import { createContext, useContext } from "react";
import type { MonthlyRanking } from "@/api/monthlyRanking";

interface ChartContextValue {
	queryData: MonthlyRanking;
	colorById: Record<string, string>;
	isolatedPoints: Record<string, Set<string>>;
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
