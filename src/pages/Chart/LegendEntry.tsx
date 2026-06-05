import classNames from "classnames/bind";
import { type LegendEntryProps, useChart } from "@/components/TimeChart";
import { UserHeader } from "@/components/UserHeader";
import type { UserMonthlyCount } from "@/db/user";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function LegendEntry({
	series: { id, total, ...user },
	seriesColor,
	seriesIndex,
	...props
}: LegendEntryProps<UserMonthlyCount>) {
	const { isHighlighted } = useChart();
	const rank = seriesIndex + 1;

	return (
		<li
			tabIndex={0}
			style={{ ["--series-color" as string]: seriesColor }}
			className={cx("info-box", { highlighted: isHighlighted(id) })}
			{...props}
		>
			<UserHeader {...user} />
			<div className={cx("details")}>
				<span className={cx("rank")} aria-label={`rank ${rank}`}>
					#{rank}
				</span>
				<span aria-label={`total score ${total}`}>{total}</span>
			</div>
		</li>
	);
}
