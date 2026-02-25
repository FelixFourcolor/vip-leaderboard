import { createContext, useContext } from "react";
import type { MonthlyRanking } from "@/db/monthlyRanking";

interface ChartContextValue {
	queryData: MonthlyRanking;
	isolatedPoints: Record<string, Set<string>>;
	idByColor: Record<string, string>;
	highlightedUser: string | null;
	setHighlightedUser: (user: string | null) => void;
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
