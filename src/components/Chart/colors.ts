const colors = [
	"#1f77b4",
	"#ff7f0e",
	"#2ca02c",
	"#d62728",
	"#9467bd",
	"#17becf",
	"#e377c2",
	"#7f7f7f",
	"#bcbd22",
	"#8c564b",
] as const;

export const COLORS_COUNT = colors.length;

export function getSeriesColor({ rank }: { rank: number }) {
	return colors[(rank - 1) % COLORS_COUNT]!;
}
