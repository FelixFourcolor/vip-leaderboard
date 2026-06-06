import classNames from "classnames/bind";
import type { PointTooltipProps } from "@/components/TimeChart";
import { UserHeader } from "@/components/UserHeader";
import type { UserMonthlyCount } from "@/db/user";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function PointTooltip({
	data: { month, rank, value },
	series,
	seriesColor,
	ref,
	style,
}: PointTooltipProps<UserMonthlyCount>) {
	return (
		<div
			ref={ref}
			style={{ ["--series-color" as string]: seriesColor, ...style }}
			className={cx("info-box", "tooltip")}
		>
			<UserHeader {...series} />
			<div className={cx("details")}>
				<span>{month}</span>
				{rank && <span aria-label={`rank ${rank}`}>#{rank}</span>}
				<span aria-label={`${value} points`}>{value}</span>
			</div>
		</div>
	);
}
