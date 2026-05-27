import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import { DataBarTable } from "@/components/DataBarTable/DataBarTable";
import { UserHeader } from "@/components/UserHeader";
import type { ActivityType } from "@/db/activity";
import { getUserStats, type UserStats } from "@/db/user";
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

	if (!data) {
		return;
	}

	return (
		<main className={cx("home-page")}>
			<div className={cx("table-container")} tabIndex={-1}>
				<DataBarTable
					rows={data}
					headerLabel="User"
					rowLabel={(props) => (
						<UserHeader {...props} className={cx("user-header")} />
					)}
					colors={colors}
					compare={compare}
					sortBy={sortBy}
					setSortBy={(sortBy) => setOptions({ sortBy })}
					className={cx("table")}
				/>
			</div>
			<div className={cx("controls-container")}>
				<RankingControls />
			</div>
		</main>
	);
}

const colors = {
	ticket: "#56d22d",
	warning: "#ffbf00",
	ban: "#ff6673",
	total: "#80aaff",
};

const compare = (a: UserStats, b: UserStats, by: ActivityType | "total") =>
	b.data[by] - a.data[by] ||
	b.lastActiveDate.valueOf() - a.lastActiveDate.valueOf() ||
	b.firstActiveDate.valueOf() - a.firstActiveDate.valueOf();
