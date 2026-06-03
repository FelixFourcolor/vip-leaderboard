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
import { FIRST_MONTH, LAST_MONTH, TWO_YEARS_AGO } from "@/db/time";
import { getUserStats, type UserStats } from "@/db/user";
import { Header } from "../Header";
import { HomeControls, useHomeControls } from "./HomeControls";
import styles from "./HomePage.module.css";

const cx = classNames.bind(styles);

export function HomePage() {
	const [options, setOptions] = useHomeControls();
	const { until, since, sortBy } = options;

	const [users, setUsers] = useState<UserStats[]>();
	const [activityStats, setActivityStats] = useState<ActivityStats[]>();
	useEffect(() => {
		getActivityCount({ since, until }).then(setActivityStats);
		getUserStats({ since, until }).then(setUsers);
	}, [since, until]);

	const containerRef = useRef<HTMLDivElement>(null);

	const timePeriod = useMemo(() => {
		if (since === until) {
			return since;
		}
		if (until === LAST_MONTH) {
			if (since === TWO_YEARS_AGO) {
				return "last 2 years";
			}
			if (since === FIRST_MONTH) {
				return "all time";
			}
		}
		return `${since} - ${until}`;
	}, [since, until]);

	return (
		<div className={cx("home-page")}>
			<div className={cx("main-container")} ref={containerRef} tabIndex={-1}>
				<Header containerRef={containerRef} />
				<main>
					{activityStats && (
						<DataBarTable
							data={activityStats}
							primaryKey="type"
							title={`Summary (${timePeriod})`}
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
					{users && (
						<DataBarTable
							data={users}
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
							onColumnChange={(sortBy) => setOptions({ sortBy })}
							compare={(a, b, by) =>
								a.data[by] - b.data[by] ||
								a.lastActiveDate.valueOf() - b.lastActiveDate.valueOf() ||
								a.firstActiveDate.valueOf() - b.firstActiveDate.valueOf()
							}
							className={cx("table", "ranking-table")}
						/>
					)}
				</main>
			</div>
			<HomeControls />
		</div>
	);
}
