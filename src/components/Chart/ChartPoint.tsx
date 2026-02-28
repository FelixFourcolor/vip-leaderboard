import type { DotsItemSymbolProps } from "@nivo/core";
import type { Point } from "@nivo/line";
import classNames from "classnames/bind";
import { Tooltip } from "@/components/Tooltip";
import { UserHeader } from "@/components/UserHeader";
import { useIsZack } from "@/hooks/useIsZack";
import { toYyyyMm } from "@/utils/time";
import type { ChartSeries } from "./Chart";
import styles from "./Chart.module.css";
import { getSeriesColor } from "./colors";
import { useChart } from "./context";

const cx = classNames.bind(styles);

export function ChartPoint({
	color,
	datum: { x, y },
}: DotsItemSymbolProps<Point<ChartSeries>>) {
	const { highlightedUser, hoveredPoint, isolatedPoints, idByColor } =
		useChart();

	const seriesId = idByColor[color];
	if (!seriesId) {
		return null;
	}

	const date = x as any as Date; // nivo type is wrong
	if (
		hoveredPoint &&
		hoveredPoint.x.getTime() === date.getTime() &&
		hoveredPoint.y === y
	) {
		return <HoveredPoint x={date} y={y} seriesId={seriesId} />;
	}
	if (isolatedPoints[seriesId]?.has(toYyyyMm(date))) {
		if (highlightedUser === seriesId) {
			return <circle r={6} fill={color} style={{ zIndex: 91 }} />;
		}
		return <circle r={3} fill={color} />;
	}
}

type HoveredPointProps = {
	x: Date;
	y: number;
	seriesId: string;
};

function HoveredPoint({ x, y, seriesId }: HoveredPointProps) {
	const { chartData } = useChart();
	const userData = chartData[seriesId]!;
	const seriesColor = getSeriesColor(userData);

	const [isZack] = useIsZack();
	const fillColor = isZack ? "var(--bg-primary)" : "var(--text-primary)";

	return (
		<Tooltip
			element={({ ref }) => (
				<>
					<circle ref={ref} r={7} fill={seriesColor} />
					<circle r={4} fill={fillColor} />
				</>
			)}
			content={({ ref, style }) => (
				<div
					ref={ref}
					style={{ ["--series-color" as string]: seriesColor, ...style }}
					className={cx("info-box", "tooltip")}
				>
					<UserHeader {...userData} />
					<table>
						<tbody>
							<tr>
								<th>{toYyyyMm(x)}</th>
								<td>{y}</td>
							</tr>
						</tbody>
					</table>
				</div>
			)}
		/>
	);
}
