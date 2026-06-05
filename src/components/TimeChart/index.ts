export type {
	TimeSeries,
	TransformOptions,
} from "./ChartWrapper";
export { useChart } from "./context";
export type { LegendEntryProps } from "./Legend";
export type { PointTooltipProps } from "./layers/Points.tsx";

import { Chart } from "./Chart";
import { ChartWrapper } from "./ChartWrapper";
import { Legend } from "./Legend";

export const TimeChart = Object.assign(ChartWrapper, { Chart, Legend });
