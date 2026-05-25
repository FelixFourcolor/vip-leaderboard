import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import { TimeChart } from "@/components/TimeChart";
import { getUserMonthlyCount, type UserMonthlyCount } from "@/db/user";
import styles from "./ChartPage.module.css";
import { ControlPanel, categoryLabels, useChartControls } from "./ControlPanel";
import { LegendEntry } from "./LegendEntry";
import { PointTooltip } from "./PointTooltip";
import { SidePanel } from "./SidePanel";

const cx = classNames.bind(styles);

export function ChartPage() {
	const [controls] = useChartControls();
	const { since, until, types } = controls;

	const [data, setData] = useState<UserMonthlyCount[]>();
	useEffect(() => {
		getUserMonthlyCount({ since, until, types }).then(setData);
	}, [since, until, types]);

	useEffect(() => {
		// fix max height to prevent layout shift on load
		// but only for this page
		const root = document.getElementById("root")!;

		root.style.maxHeight = "100vh";
		document.body.style.overflow = "hidden";

		return () => {
			root.style.maxHeight = "";
			document.body.style.overflow = "";
		};
	}, []);

	return (
		<main className={cx("chart-page")}>
			<TimeChart data={data} {...controls} PointTooltip={PointTooltip}>
				<fieldset className={cx("chart")}>
					<legend>chart</legend>
					<TimeChart.Chart
						margin={{ top: 22, right: 34, bottom: 30, left: 70 }}
						axisLeft={{
							legendOffset: -54,
							legend:
								types.map((t) => categoryLabels[t]).join(" + ") || "Activities",
						}}
					/>
				</fieldset>
				<SidePanel>
					<TimeChart.Legend Entry={LegendEntry} className={cx("legend")} />
				</SidePanel>
			</TimeChart>
			<ControlPanel />
		</main>
	);
}
