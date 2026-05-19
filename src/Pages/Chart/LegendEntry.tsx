import classNames from "classnames/bind";
import { type LegendEntryProps, useChart } from "@/components/TimeChart";
import { UserHeader } from "@/components/UserHeader";
import type { UserMonthlyData } from "@/db/monthlyData";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function LegendEntry({
	series: { id, rank, count, ...user },
	seriesColor,
	...nativeProps
}: LegendEntryProps<UserMonthlyData>) {
	const { isHighlighted } = useChart();

	return (
		<div
			tabIndex={0}
			style={{ ["--series-color" as string]: seriesColor }}
			className={cx("info-box", { highlighted: isHighlighted(id) })}
			{...nativeProps}
		>
			<UserHeader {...user} />
			<table>
				<tbody>
					<tr>
						<th>#{rank}</th>
						<td>{count}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
