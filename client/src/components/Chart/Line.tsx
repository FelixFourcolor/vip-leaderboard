import { ResponsiveLine } from "@nivo/line";

export const Line: typeof ResponsiveLine = (props) => (
	<ResponsiveLine
		theme={themeConfig}
		curve="monotoneX"
		useMesh
		enableCrosshair={false}
		enablePointLabel
		xFormat="time:%Y-%m"
		xScale={{ type: "time", useUTC: false }}
		margin={{ top: 16, right: 24, bottom: 24, left: 60 }}
		axisLeft={{ legend: "Tickets handled", legendOffset: -44 }}
		axisBottom={{ format: "%Y-%m" }}
		{...props}
	/>
);

const themeConfig = {
	background: "var(--bg-secondary)",
	text: {
		fill: "var(--text-primary)",
		fontSize: "var(--text-mini)",
	},
	crosshair: {
		line: { stroke: "var(--text-secondary)" },
	},
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
};
