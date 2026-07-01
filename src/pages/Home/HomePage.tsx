import classNames from "classnames/bind";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { type ActivityStats, getActivityStats } from "@/db/activity";
import { getUserStats, type UserStats, userSortBy } from "@/db/user";
import { useDelay } from "@/hooks/useDelay";
import { yyyyMmOffset } from "@/utils/time";
import { Header } from "../Header";
import { HomeControls, useHomeControls } from "./HomeControls";
import styles from "./HomePage.module.css";
import { RankingTable } from "./RankingTable";
import { SummaryTable } from "./SummaryTable";

const cx = classNames.bind(styles);

export function HomePage() {
	const [{ until, since, sortBy }] = useHomeControls();

	const [activityStats, setActivityStats] = useState<ActivityStats[]>();
	useEffect(() => {
		getActivityStats({ since, until }).then(setActivityStats);
	}, [since, until]);

	const [users, setUsers] = useState<UserStats[]>();
	const [usersLastMonth, setUsersLastMonth] = useState<UserStats[]>();
	useEffect(() => {
		getUserStats({ since, until }).then(setUsers);
		getUserStats({
			since: yyyyMmOffset(since, { months: -1 }),
			until: yyyyMmOffset(until, { months: -1 }),
		}).then(setUsersLastMonth);
	}, [since, until]);

	const rankings = useMemo(() => {
		if (!users || !usersLastMonth) {
			return;
		}

		const filteredUsersLastMonth = usersLastMonth.filter((u) => u.data[sortBy]);
		const idxLastMonth = Object.fromEntries(
			filteredUsersLastMonth
				.sort(userSortBy((u) => u.data[sortBy]))
				.map((u, i) => [u.id, i]),
		);

		return users
			.filter((u) => u.data[sortBy])
			.sort(userSortBy((u) => u.data[sortBy]))
			.map((u, i) => ({
				...u,
				rankChange: (idxLastMonth[u.id] ?? filteredUsersLastMonth.length) - i,
			}));
	}, [users, usersLastMonth, sortBy]);

	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<div className={cx("home-page")}>
			<div className={cx("main-container")} ref={containerRef} tabIndex={-1}>
				<Header containerRef={containerRef} />
				<main>
					{useDelay() && activityStats && rankings ? (
						<>
							<SummaryTable data={activityStats} />
							<RankingTable data={rankings} />
						</>
					) : (
						<div className={cx("spinner-container")}>
							<LoadingSpinner size={56} />
						</div>
					)}
				</main>
			</div>
			<HomeControls />
		</div>
	);
}
