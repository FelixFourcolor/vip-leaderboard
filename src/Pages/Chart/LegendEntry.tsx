import classNames from "classnames/bind";
import { useGrab } from "@/components/RangeSlider";
import { useResize } from "@/components/Resizer";
import { type LegendEntryProps, useChart } from "@/components/TimeChart";
import { UserHeader } from "@/components/UserHeader";
import type { UserMonthlyData } from "@/db/monthlyData";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function LegendEntry({
	series: { id, rank, count, ...user },
	seriesColor,
	ref,
}: LegendEntryProps<UserMonthlyData>) {
	const { isHighlighted, setHighlightedSeries } = useChart();
	const { isGrabbing } = useGrab();
	const { isResizing } = useResize();

	return (
		<div
			ref={ref}
			style={{ ["--series-color" as string]: seriesColor }}
			className={cx("info-box", { highlighted: isHighlighted(id) })}
			onMouseEnter={() => {
				if (!isResizing && !isGrabbing) {
					setHighlightedSeries(id);
				}
			}}
			onMouseLeave={() => setHighlightedSeries(undefined)}
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
