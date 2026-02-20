import type { RankingData, UserData } from "@server/api";
import classNames from "classnames/bind";
import { UserHeader } from "@/components/UserHeader";
import styles from "./Chart.module.css";
import { useChart } from "./context";

const cx = classNames.bind(styles);

export function ChartLegend() {
	const { data } = useChart();

	return (
		<div className={cx("legend")}>
			{Object.entries(data).map(([id, user]) => (
				<LegendEntry key={id} userId={id} {...user} />
			))}
		</div>
	);
}

type EntryProps = UserData & RankingData[string] & { userId: string };

function LegendEntry({ userId, count, rank, ...userData }: EntryProps) {
	const { colorById } = useChart();
	return (
		<div style={{ borderColor: colorById[userId] }} className={cx("info-box")}>
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
