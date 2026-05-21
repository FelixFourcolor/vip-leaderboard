import classNames from "classnames/bind";
import { type LegendEntryProps, useChart } from "@/components/TimeChart";
import { UserHeader } from "@/components/UserHeader";
import type { UserMonthlyData } from "@/db/monthlyData";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function LegendEntry({
	series: { id, rank, count, ...user },
	seriesColor,
	...props
}: LegendEntryProps<UserMonthlyData>) {
	const { isHighlighted } = useChart();

	return (
		<li
			tabIndex={0}
			style={{ ["--series-color" as string]: seriesColor }}
			className={cx("info-box", { highlighted: isHighlighted(id) })}
			{...props}
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
		</li>
	);
}
