import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import { DataBarTable } from "@/components/DataBarTable/DataBarTable";
import { UserHeader } from "@/components/UserHeader";
import { getUserStats, type UserStats } from "@/db/user";
import { Controls, useRankingControls } from "./Controls";
import styles from "./HomePage.module.css";

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
					sortBy={sortBy}
					setSortBy={(sortBy) => setOptions({ sortBy })}
					className={cx("table")}
				/>
			</div>
			<div className={cx("controls-container")}>
				<Controls />
			</div>
		</main>
	);
}

const colors = {
	ticket: "hsl(95, 70%, 50%)",
	warning: "hsl(45, 100%, 50%)",
	ban: "#ff6673",
	total: "#80aaff",
};
