import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import { DataBarTable } from "@/components/DataBarTable/DataBarTable";
import { UserHeader } from "@/components/UserHeader";
import { getUserStats, type UserStats } from "@/db/user";
import { ControlPanel, useRankingControls } from "./ControlPanel";
import styles from "./HomePage.module.css";

const cx = classNames.bind(styles);

export function HomePage() {
	const [options, setOptions] = useRankingControls();
	const { until, since, sortBy } = options;

	const [data, setData] = useState<UserStats[]>();
	console.log(data);
	useEffect(() => {
		getUserStats({ since, until }).then(setData);
	}, [since, until]);

	if (!data) {
		return;
	}

	return (
		<main className={cx("home-page")}>
			<DataBarTable
				rows={data}
				headerLabel="User"
				RowLabel={UserHeader}
				colors={colors}
				sortBy={sortBy}
				setSortBy={(sortBy) => setOptions({ sortBy })}
			/>
			<ControlPanel />
		</main>
	);
}

const colors = {
	ticket: "#7cb342",
	warning: "#ffcc32",
	ban: "#f44336",
	total: "#6674cc",
};
