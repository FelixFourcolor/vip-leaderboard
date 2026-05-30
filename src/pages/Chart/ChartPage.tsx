import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import { TimeChart } from "@/components/TimeChart";
import { activityLabels } from "@/db/activity";
import { getUserMonthlyStats, type UserMonthlyStats } from "@/db/user";
import { Header } from "../Header";
import { ChartControls, useChartControls } from "./ChartControls";
import styles from "./ChartPage.module.css";
import { LegendEntry } from "./LegendEntry";
import { PointTooltip } from "./PointTooltip";
import { SidePanel } from "./SidePanel";

const cx = classNames.bind(styles);

export function ChartPage() {
	const [options] = useChartControls();
	const { since, until, types } = options;

	const [data, setData] = useState<UserMonthlyStats[]>();
	useEffect(() => {
		getUserMonthlyStats({ since, until, types }).then(setData);
	}, [since, until, types]);

	useEffect(() => {
		// to disable scrolling but only for this page
		const root = document.getElementById("root")!;

		const { overflow, maxHeight } = document.body.style;
		document.body.style.overflow = "hidden";
		root.style.maxHeight = "100dvh";
		return () => {
			document.body.style.overflow = overflow;
			root.style.maxHeight = maxHeight;
		};
	}, []);

	return (
		<>
			<Header position="absolute" />
			<main className={cx("chart-page")}>
				<TimeChart
					{...options}
					data={data}
					PointTooltip={PointTooltip}
					renderDelay={100}
				>
					<fieldset className={cx("chart")}>
						<legend>chart</legend>
						<TimeChart.Chart
							margin={{ top: 22, right: 34, bottom: 30, left: 70 }}
							axisLeft={{
								legendOffset: -54,
								legend:
									types.map((t) => activityLabels[t]).join(" + ") ||
									"Activities",
							}}
						/>
					</fieldset>
					<SidePanel>
						<TimeChart.Legend Entry={LegendEntry} className={cx("legend")} />
					</SidePanel>
				</TimeChart>
				<ChartControls />
			</main>
		</>
	);
}
