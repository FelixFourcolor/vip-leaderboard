import classNames from "classnames/bind";
import { useRef } from "react";
import { Header } from "../Header";
import { HomeControls } from "./HomeControls";
import styles from "./HomePage.module.css";
import { RankingTable } from "./RankingTable";
import { SummaryTable } from "./SummaryTable";

const cx = classNames.bind(styles);

export function HomePage() {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<div className={cx("home-page")}>
			<div className={cx("main-container")} ref={containerRef} tabIndex={-1}>
				<Header containerRef={containerRef} />
				<main>
					<SummaryTable />
					<RankingTable />
				</main>
			</div>
			<HomeControls />
		</div>
	);
}
