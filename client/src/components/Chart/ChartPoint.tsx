import type { DotsItemSymbolProps } from "@nivo/core";
import type { Point } from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useMemo } from "react";
import { Tooltip } from "@/components/Tooltip";
import { UserHeader } from "@/components/UserHeader";
import { useZackMode } from "@/hooks/useZackMode";
import { slidingWindow } from "@/utils/iter";
import { toYyyyMm } from "@/utils/time";
import type { ChartSeries } from "./Chart";
import styles from "./Chart.module.css";
import { useChart } from "./context";

const cx = classNames.bind(styles);

export function ChartPoint({
	color,
	datum: { x, y },
}: DotsItemSymbolProps<Point<ChartSeries>>) {
	const { monthlyData, hoveredPoint, colorById } = useChart();

	const isolatedPoints = useMemo(() => {
		return mapValues(monthlyData, (monthlyCount) => {
			return new Set(
				Array.from(slidingWindow(monthlyCount, 3))
					.filter(
						([prev, , next]) => prev?.count == null && next?.count == null,
					)
					.map(([, current]) => current.month),
			);
		});
	}, [monthlyData]);

	// workaround for nivo's bug of not exposing seriesId for each point
	const idByColor = useMemo(
		() =>
			// requires number of users <= 10 = number of colors
			Object.fromEntries(
				Object.entries(colorById).map(([id, color]) => [color, id]),
			),
		[colorById],
	);

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
		return <circle r={3} fill={color} />;
	}
}

type HoveredPointProps = {
	x: Date;
	y: number;
	seriesId: string;
};

function HoveredPoint({ x, y, seriesId }: HoveredPointProps) {
	const { userData, colorById } = useChart();
	const seriesColor = colorById[seriesId]!;
	const { color: userColor, avatarUrl, name } = userData[seriesId]!;

	const [isZack] = useZackMode();
	const innerColor = isZack ? "var(--bg-primary)" : "var(--text-primary)";

	return (
		<Tooltip
			element={({ ref }) => (
				<>
					<circle ref={ref} r={8} fill={seriesColor} />
					<circle r={5} fill={innerColor} />
				</>
			)}
			content={({ ref, style }) => (
				<div
					ref={ref}
					style={{ borderColor: seriesColor, ...style }}
					className={cx("info-box", "tooltip")}
				>
					<UserHeader name={name} color={userColor} avatarUrl={avatarUrl} />
					<table>
						<tbody>
							<tr>
								<th>Month:</th>
								<td>{toYyyyMm(x)}</td>
							</tr>
							<tr>
								<th>Tickets:</th>
								<td>{y}</td>
							</tr>
						</tbody>
					</table>
				</div>
			)}
		/>
	);
}
