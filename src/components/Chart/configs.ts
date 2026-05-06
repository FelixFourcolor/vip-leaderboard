import type { ResponsiveLine } from "@nivo/line";
import type { ComponentProps } from "react";
import type { ChartSeries } from "./Chart";
import { ChartAreas } from "./layers/Areas";
import { ChartLabels } from "./layers/Labels";
import { ChartLines } from "./layers/Lines";
import { ChartPoints } from "./layers/Points";

export default {
	tooltip: () => null,
	curve: "monotoneX",
	useMesh: true,
	enableCrosshair: false,
	xFormat: "time:%Y-%m",
	xScale: { type: "time", useUTC: false },
	yScale: { type: "linear", min: 0 },
	margin: { top: 24, right: 28, bottom: 24, left: 64 },
	axisLeft: { legend: "Tickets handled", legendOffset: -48 },
	axisBottom: { format: "%Y-%m" },
	layers: [
		"grid",
		"axes",
		ChartAreas,
		ChartLines,
		ChartPoints,
		ChartLabels,
		"mesh",
	],
	theme: {
		background: "var(--bg-secondary)",
		text: { fill: "var(--text-primary)" },
		axis: {
			ticks: {
				line: {
					stroke: "var(--text-tertiary)",
					strokeWidth: 0.5,
				},
				text: {
					fill: "var(--text-secondary)",
					fontWeight: "bold",
				},
			},
			legend: {
				text: { fontSize: "var(--text-regular)" },
			},
		},
		grid: {
			line: {
				stroke: "var(--text-tertiary)",
				strokeWidth: 0.5,
			},
		},
	},
} satisfies Partial<ComponentProps<typeof ResponsiveLine<ChartSeries>>>;
