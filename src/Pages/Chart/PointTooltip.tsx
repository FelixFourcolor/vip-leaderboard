import classNames from "classnames/bind";
import type { TooltipProps } from "@/components/TimeChart";
import { UserHeader } from "@/components/UserHeader";
import type { UserMonthlyData } from "@/db/monthlyData";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function PointTooltip({
	data: { x, y },
	series,
	seriesColor,
	ref,
	style,
}: TooltipProps<UserMonthlyData>) {
	return (
		<div
			ref={ref}
			style={{ ["--series-color" as string]: seriesColor, ...style }}
			className={cx("info-box", "tooltip")}
		>
			<UserHeader {...series} />
			<table>
				<tbody>
					<tr>
						<th>{x}</th>
						<td>{y}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
