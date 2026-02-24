import classNames from "classnames/bind";
import { UserHeader } from "@/components/UserHeader";
import type { RankingData } from "@/db/ranking";
import styles from "./Chart.module.css";
import { getSeriesColor } from "./colors";
import { useChart } from "./context";

const cx = classNames.bind(styles);

export function ChartLegend() {
	const { queryData } = useChart();
	return (
		<div className={cx("legend")}>
			{Object.entries(queryData).map(([userId, userData]) => (
				<LegendEntry key={userId} {...userData} />
			))}
		</div>
	);
}

type EntryProps = RankingData[string];

function LegendEntry({ count, rank, ...userData }: EntryProps) {
	const seriesColor = getSeriesColor({ rank });
	return (
		<div style={{ borderColor: seriesColor }} className={cx("info-box")}>
			<UserHeader {...userData} />
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
