import classNames from "classnames/bind";
import { useEffect, useMemo, useState } from "react";
import { DataBarTable } from "@/components/DataBarTable";
import { UserHeader } from "@/components/UserHeader";
import { type ActivityType, activityColors } from "@/db/activity";
import { getUserStats, type UserStats } from "@/db/user";
import { useWindowSize } from "@/hooks/useWindowSize";
import { timeOffset } from "@/utils/time";
import { useHomeControls } from "./HomeControls";
import styles from "./HomePage.module.css";

const cx = classNames.bind(styles);

export function RankingTable() {
	const [options, setOptions] = useHomeControls();
	const { until, since, sortBy } = options;

	const [users, setUsers] = useState<UserStats[]>();
	const [usersLastMonth, setUsersLastMonth] = useState<UserStats[]>();
	useEffect(() => {
		getUserStats({ since, until }).then(setUsers);
		getUserStats({
			since: timeOffset(since, { months: -1 }),
			until: timeOffset(until, { months: -1 }),
		}).then(setUsersLastMonth);
	}, [since, until]);

	const rankings = useMemo(() => {
		if (!users || !usersLastMonth) {
			return;
		}
		const lastMonthIndex = Object.fromEntries(
			usersLastMonth
				.sort(userCompare(sortBy))
				.map(({ id }, index) => [id, index]),
		);
		return users.sort(userCompare(sortBy)).map((user, index) => ({
			...user,
			rankChange: (lastMonthIndex[user.id] ?? usersLastMonth.length) - index,
		}));
	}, [users, usersLastMonth, sortBy]);

	const isLargeScreen = useWindowSize({ minWidth: 501 });

	if (!rankings) {
		return;
	}

	return (
		<DataBarTable
			rows={rankings}
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
								>
									{rankChange === 0 ? "" : Math.abs(rankChange)}
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
				ticket: {
					header: "Tickets",
					cell: ({ data }) => (
						<div className={cx("cell")}>{data.ticket || ""}</div>
					),
				},
				warning: {
					header: "Warnings",
					cell: ({ data }) => (
						<div className={cx("cell")}>{data.warning || ""}</div>
					),
				},
				ban: {
					header: "Bans",
					cell: ({ data }) => (
						<div className={cx("cell")}>{data.ban || ""}</div>
					),
				},
				total: {
					header: "Total",
					cell: ({ data }) => (
						<div className={cx("cell")}>{data.total || ""}</div>
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

const userCompare =
	(sortBy: ActivityType | "total") => (a: UserStats, b: UserStats) =>
		b.data[sortBy] - a.data[sortBy] ||
		b.lastActiveDate.valueOf() - a.lastActiveDate.valueOf() ||
		b.firstActiveDate.valueOf() - a.firstActiveDate.valueOf();
