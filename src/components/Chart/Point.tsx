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
		const highlighted = highlightedUser === seriesId;
		return (
			<>
				{highlighted && (
					<circle
						r={6}
						fill={color}
						opacity={isZack ? 0.35 : 0.5}
						style={{ filter: "blur(3px)" }}
					/>
				)}
				<circle r={highlighted ? 4 : 3} fill={color} />
			</>
		);
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

	return (
		<Tooltip
			element={({ ref }) => (
				<>
					<circle ref={ref} r={8} fill={seriesColor} />
					<circle r={5} fill={"var(--bg-primary)"} />
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
