export { useChart } from "./context";
export type { LegendEntryProps } from "./Legend";
export type { PointTooltipProps } from "./layers/Points.tsx";

import { Chart } from "./Chart";
import { Legend } from "./Legend";
import { Wrapper } from "./Wrapper";

export const TimeChart = Object.assign(Wrapper, { Chart, Legend });
