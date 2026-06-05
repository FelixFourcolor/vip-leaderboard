import classNames from "classnames/bind";
import type { PointTooltipProps } from "@/components/TimeChart";
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
	return (
		<div
			ref={ref}
			style={{ ["--series-color" as string]: seriesColor, ...style }}
			className={cx("info-box", "tooltip")}
		>
			<UserHeader {...series} />
			<div className={cx("details")}>
				<span>{x}</span>
				<span aria-label={`${y} points`}>{y}</span>
			</div>
		</div>
	);
}
