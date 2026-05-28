import classNames from "classnames/bind";
import { useEffect, useRef, useState } from "react";
import { DataBarTable } from "@/components/DataBarTable";
import { UserHeader } from "@/components/UserHeader";
import type { ActivityType } from "@/db/activity";
import { getUserStats, type UserStats } from "@/db/user";
import { Header } from "../Header";
import styles from "./HomePage.module.css";
import { RankingControls, useRankingControls } from "./RankingControls";

const cx = classNames.bind(styles);

export function HomePage() {
	const [options, setOptions] = useRankingControls();
	const { until, since, sortBy } = options;

	const [data, setData] = useState<UserStats[]>();
	useEffect(() => {
		getUserStats({ since, until }).then(setData);
	}, [since, until]);

	const containerRef = useRef<HTMLDivElement>(null);

	if (!data) {
		return;
	}

	return (
		<div className={cx("home-page")}>
			<div className={cx("main-container")} ref={containerRef} tabIndex={-1}>
				<Header containerRef={containerRef} />
				<main>
					<DataBarTable
						data={data}
						renderers={{
							$index: {
								header: "#",
								data: ({ index }) => (
									<div className={cx("cell")}>{index + 1}</div>
								),
							},
							name: {
								header: "User",
								data: ({ row }) => (
									<UserHeader {...row} className={cx("user-header")} />
								),
							},
							ticket: {
								header: "Tickets",
								data: ({ row }) => (
									<div className={cx("cell")}>{row.data.ticket || ""}</div>
								),
							},
							warning: {
								header: "Warnings",
								data: ({ row }) => (
									<div className={cx("cell")}>{row.data.warning || ""}</div>
								),
							},
							ban: {
								header: "Bans",
								data: ({ row }) => (
									<div className={cx("cell")}>{row.data.ban || ""}</div>
								),
							},
							total: {
								header: "Total",
								data: ({ row }) => (
									<div className={cx("cell")}>{row.data.total || ""}</div>
								),
							},
						}}
						colors={colors}
						compare={compare}
						sortBy={sortBy}
						setSortBy={(sortBy) => setOptions({ sortBy })}
						className={cx("table")}
					/>
				</main>
			</div>
			<RankingControls />
		</div>
	);
}

const colors = {
	ticket: "#5cc639",
	warning: "#ffbf00",
	ban: "#ff6673",
	total: "#80aaff",
};

const compare = (a: UserStats, b: UserStats, by: ActivityType | "total") =>
	b.data[by] - a.data[by] ||
	b.lastActiveDate.valueOf() - a.lastActiveDate.valueOf() ||
	b.firstActiveDate.valueOf() - a.firstActiveDate.valueOf();
