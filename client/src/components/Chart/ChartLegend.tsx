import type { RankingData, UserData } from "@server/api";
import classNames from "classnames/bind";
import { UserHeader } from "@/components/UserHeader";
import styles from "./Chart.module.css";
import { getSeriesColor } from "./colors";
import { useChart } from "./context";

const cx = classNames.bind(styles);

export function ChartLegend() {
	const { queryData } = useChart();
	return (
		<div className={cx("legend")}>
			{Object.entries(queryData).map(([id, user]) => (
				<LegendEntry key={id} userId={id} {...user} />
			))}
		</div>
	);
}

type EntryProps = UserData & RankingData[number];

function LegendEntry({ userId, count, rank, ...userData }: EntryProps) {
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
