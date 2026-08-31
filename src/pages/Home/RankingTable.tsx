import classNames from "classnames/bind";
import { DataBarTable } from "@/components/DataBarTable";
import { UserHeader } from "@/components/UserHeader";
import { activityColors } from "@/db/activity";
import type { UserStats } from "@/db/user";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useHomeControls } from "./HomeControls";
import styles from "./HomePage.module.css";

const cx = classNames.bind(styles);

interface Ranking extends UserStats {
	rankChange: number;
}

export function RankingTable({ data }: { data: Ranking[] }) {
	const [{ sortBy }, setOptions] = useHomeControls();
	const isLargeScreen = useWindowSize({ minWidth: 501 });

	return (
		<DataBarTable
			rows={data}
			primaryKey="id"
			columns={{
				"[index]": {
					header: isLargeScreen ? "Rank" : "#",
					cell: ({ "[index]": index, rankChange }) => (
						<div className={cx("cell", { rank: isLargeScreen })}>
							<span className={cx("rank-number")}>{index + 1}</span>
							{isLargeScreen && (
								<span
									className={cx("rank-change", {
										positive: rankChange > 0,
										negative: rankChange < 0,
									})}
									aria-label={
										!rankChange
											? "rank unchanged"
											: `${rankChange > 0 ? "up" : "down"} ${Math.abs(rankChange)}`
									}
								>
									{!!rankChange && Math.abs(rankChange)}
								</span>
							)}
						</div>
					),
				},
				name: {
					header: "User",
					cell: (user) => (
						<UserHeader {...user} className={cx("user-header")} />
					),
				},
				report: {
					header: "Reports",
					cell: ({ data: { report } }) => (
						<div className={cx("cell")}>{report || ""}</div>
					),
				},
				warning: {
					header: "Warnings",
					cell: ({ data: { warning } }) => (
						<div className={cx("cell")}>{warning || ""}</div>
					),
				},
				ban: {
					header: "Bans",
					cell: ({ data: { ban } }) => (
						<div className={cx("cell")}>{ban || ""}</div>
					),
				},
				total: {
					header: "Total",
					cell: ({ data: { total } }) => (
						<div className={cx("cell")}>{total || ""}</div>
					),
				},
			}}
			columnColors={activityColors}
			activeColumn={sortBy}
			onColumnChange={(sortBy) => setTimeout(() => setOptions({ sortBy }))}
			sorted="descending"
			SortIcon={({ sorted }) => (
				<span className={cx("sort-icon", { sorted })}>▼</span>
			)}
			className={cx("table", "ranking-table")}
		/>
	);
}
