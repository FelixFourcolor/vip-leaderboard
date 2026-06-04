import classNames from "classnames/bind";
import { useEffect, useMemo, useState } from "react";
import { DataBarTable } from "@/components/DataBarTable";
import { UserHeader } from "@/components/UserHeader";
import { activityColors } from "@/db/activity";
import { getUserStats, type UserStats } from "@/db/user";
import { useHomeControls } from "./HomeControls";
import styles from "./HomePage.module.css";

const cx = classNames.bind(styles);

export function RankingTable() {
	const [options, setOptions] = useHomeControls();
	const { until, since, sortBy } = options;

	const [users, setUsers] = useState<UserStats[]>();
	useEffect(() => {
		getUserStats({ since, until }).then(setUsers);
	}, [since, until]);

	const rankings = useMemo(() => {
		// `toSorted` rather than `sort` to trigger table to re-render
		return users?.toSorted(
			(a, b) =>
				b.data[sortBy] - a.data[sortBy] ||
				b.lastActiveDate.valueOf() - a.lastActiveDate.valueOf() ||
				b.firstActiveDate.valueOf() - a.firstActiveDate.valueOf(),
		);
	}, [users, sortBy]);

	if (!rankings) {
		return;
	}

	return (
		<DataBarTable
			rows={rankings}
			primaryKey="id"
			columns={{
				"[index]": {
					header: "#",
					cell: ({ "[index]": index }) => (
						<div className={cx("cell")}>{index + 1}</div>
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
			onColumnChange={(sortBy) => setOptions({ sortBy })}
			sorted="descending"
			SortIcon={({ sorted }) => (
				<span className={cx("sort-icon", { sorted })}>▼</span>
			)}
			className={cx("table", "ranking-table")}
		/>
	);
}
