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
			{Object.values(queryData).map((user) => (
				<LegendEntry key={user.id} {...user} />
			))}
		</div>
	);
}

type EntryProps = RankingData[string];

function LegendEntry({ id, count, rank, ...userData }: EntryProps) {
	const { highlightedUser, setHighlightedUser } = useChart();
	return (
		<div
			style={{ ["--series-color" as string]: getSeriesColor({ rank }) }}
			className={cx("info-box", { highlighted: highlightedUser === id })}
			onMouseEnter={() => setHighlightedUser(id)}
			onMouseLeave={() => setHighlightedUser(undefined)}
		>
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
