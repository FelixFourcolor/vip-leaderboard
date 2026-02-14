import { createContext, useContext } from "react";
import type { MonthlyData } from "@/api/types";

interface ChartContextValue {
	hoveredPoint: { x: Date; y: number } | null;
	idByColor: Record<string, string>;
	isolatedPoints: Record<string, Set<string>>;
	colorById: Record<string, string>;
	queryData: MonthlyData;
	highlightedUser: string | null;
}

export const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart() {
	const context = useContext(ChartContext);
	if (!context) {
		throw new Error("useChart must be used within a ChartContext.Provider");
	}
	return context;
}
