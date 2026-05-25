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

	return (
		<li
			tabIndex={0}
			style={{ ["--series-color" as string]: seriesColor }}
			className={cx("info-box", { highlighted: isHighlighted(id) })}
			{...props}
		>
			<UserHeader {...user} />
			<dl>
				<dt className={"sr-only"}>Rank</dt>
				<dd className={cx("rank")}>{seriesIndex + 1}</dd>
				<dt className={"sr-only"}>Activities</dt>
				<dd>{total}</dd>
			</dl>
		</li>
	);
}
