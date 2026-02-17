import {
	autoUpdate,
	flip,
	offset,
	shift,
	useFloating,
} from "@floating-ui/react";
import type { DotsItemSymbolProps } from "@nivo/core";
import type { Point } from "@nivo/line";
import classNames from "classnames/bind";
import { createPortal } from "react-dom";
import { UserHeader } from "@/components/UserHeader";
import { useZackMode } from "@/hooks/useZackMode";
import { toYyyyMm } from "@/utils/time";
import type { ChartSeries } from "./Chart";
import styles from "./Chart.module.css";
import { useChart } from "./context";

const cx = classNames.bind(styles);

export function ChartPoint({
	color,
	datum: { x, y },
}: DotsItemSymbolProps<Point<ChartSeries>>) {
	const { hoveredPoint, idByColor, isolatedPoints } = useChart();
	const date = x as any as Date; // nivo type is wrong

	const seriesId = idByColor[color];
	if (!seriesId) {
		return null;
	}
	if (
		hoveredPoint &&
		hoveredPoint.x.getTime() === date.getTime() &&
		hoveredPoint.y === y
	) {
		return <PointWithTooltip {...{ color, date, y, seriesId }} />;
	}
	if (isolatedPoints[seriesId]?.has(toYyyyMm(date))) {
		return <circle r={3} fill={color} />;
	}
}

function PointWithTooltip({
	color,
	date,
	y,
	seriesId,
}: {
	color: string;
	date: Date;
	y: number;
	seriesId: string;
}) {
	const { userData, colorById } = useChart();
	const { refs, floatingStyles } = useFloating({
		placement: "top",
		strategy: "fixed",
		middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
		whileElementsMounted: autoUpdate,
	});

	const seriesColor = colorById[seriesId]!;
	const { color: userColor, avatarUrl, name } = userData[seriesId]!;
	const [isZack] = useZackMode();
	const innerColor = isZack ? "var(--bg-primary)" : "var(--text-primary)";

	return (
		<>
			<circle ref={refs.setReference} r={8} fill={color} />
			<circle r={5} fill={innerColor} />
			{createPortal(
				<div ref={refs.setFloating} style={floatingStyles}>
					<div
						style={{ ["--series-color" as string]: seriesColor }}
						className={cx("tooltip")}
					>
						<UserHeader name={name} color={userColor} avatarUrl={avatarUrl} />
						<div className={cx("detail")}>
							<span className={cx("label")}>Month:</span>
							<span className={cx("data")}>{toYyyyMm(date)}</span>
							<br />
							<span className={cx("label")}>Tickets:</span>
							<span className={cx("data")}>{y}</span>
						</div>
					</div>
				</div>,
				document.body,
			)}
		</>
	);
}
