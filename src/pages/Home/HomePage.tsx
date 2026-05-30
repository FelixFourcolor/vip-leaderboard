import classNames from "classnames/bind";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataBarTable } from "@/components/DataBarTable";
import { UserHeader } from "@/components/UserHeader";
import {
	type ActivityStats,
	activityColors,
	activityIcons,
	activityLabels,
	getActivityCount,
} from "@/db/activity";
import { getUserStats, type UserStats } from "@/db/user";
import { Header } from "../Header";
import { HomeControls, useHomeControls } from "./HomeControls";
import styles from "./HomePage.module.css";

const cx = classNames.bind(styles);

export function HomePage() {
	const [options, setOptions] = useHomeControls();
	const { until, since, sortBy } = options;

	const [users, setUsers] = useState<UserStats[]>();
	const [activityData, setActivityData] = useState<ActivityStats[]>();
	useEffect(() => {
		getActivityCount({ since, until }).then(setActivityData);
		getUserStats({ since, until }).then(setUsers);
	}, [since, until]);

	const rankings = useMemo(() => {
		return users?.sort(
			(a, b) =>
				b.data[sortBy] - a.data[sortBy] ||
				b.lastActiveDate.valueOf() - a.lastActiveDate.valueOf() ||
				b.firstActiveDate.valueOf() - a.firstActiveDate.valueOf(),
		);
	}, [users, sortBy]);

	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<div className={cx("home-page")}>
			<div className={cx("main-container")} ref={containerRef} tabIndex={-1}>
				<Header containerRef={containerRef} />
				<main>
					{activityData && (
						<DataBarTable
							rows={activityData}
							primaryKey="type"
							title="Global stats"
							columns={{
								type: {
									cell: ({ type }) => (
										<span className={cx("type-cell")}>
											{activityLabels[type]}
											{type !== "total" && (
												<span className={cx("icon")}>
													{activityIcons[type]}
												</span>
											)}
										</span>
									),
								},
								count: { cell: ({ data }) => data.count || "" },
							}}
							activeColumn="count"
							rowColors={activityColors}
							className={cx("table", "summary-table")}
						/>
					)}
					{rankings && (
						<DataBarTable
							rows={rankings}
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
							primaryKey="id"
							columnColors={activityColors}
							activeColumn={sortBy}
							onSort={(sortBy) => setOptions({ sortBy })}
							className={cx("table", "ranking-table")}
						/>
					)}
				</main>
			</div>
			<HomeControls />
		</div>
	);
}
