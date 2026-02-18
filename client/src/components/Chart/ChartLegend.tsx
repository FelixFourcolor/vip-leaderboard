import classNames from "classnames/bind";
import type { RankedUser } from "@/api/types";
import { UserHeader } from "@/components/UserHeader";
import styles from "./Chart.module.css";
import { useChart } from "./context";

const cx = classNames.bind(styles);

export function ChartLegend() {
	const { userData } = useChart();

	return (
		<div className={cx("legend")}>
			{Object.entries(userData).map(([id, user]) => (
				<LegendEntry key={id} userId={id} {...user} />
			))}
		</div>
	);
}

interface EntryProps extends RankedUser {
	userId: string;
}

function LegendEntry({ userId, name, color, avatarUrl, count }: EntryProps) {
	const { colorById } = useChart();
	const seriesColor = colorById[userId];

	return (
		<div style={{ borderColor: seriesColor }} className={cx("info-box")}>
			<UserHeader name={name} color={color} avatarUrl={avatarUrl} />
			<table>
				<tbody>
					<tr>
						<th>Total:</th>
						<td>{count}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
