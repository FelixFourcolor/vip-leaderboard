import classNames from "classnames/bind";
import { type PointTooltipProps, useChart } from "@/components/TimeChart";
import { UserHeader } from "@/components/UserHeader";
import type { UserMonthlyCount } from "@/db/user";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function PointTooltip({
	data: { x, y },
	series,
	seriesColor,
	ref,
	style,
}: PointTooltipProps<UserMonthlyCount>) {
	const { bump } = useChart();

	return (
		<div
			ref={ref}
			style={{ ["--series-color" as string]: seriesColor, ...style }}
			className={cx("info-box", "tooltip")}
		>
			<UserHeader {...series} />
			<div className={cx("details")}>
				<span>{x}</span>
				<span aria-label={bump ? `rank ${y}` : `${y} points`}>
					{bump && "#"}
					{y}
				</span>
			</div>
		</div>
	);
}
