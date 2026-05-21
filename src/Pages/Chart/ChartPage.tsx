import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import { Legend, TimeChart, TimeChartProvider } from "@/components/TimeChart";
import { getMonthlyData, type UserMonthlyData } from "@/db/monthlyData";
import styles from "./ChartPage.module.css";
import { ControlPanel, categoryLabels, useChartControls } from "./ControlPanel";
import { LegendEntry } from "./LegendEntry";
import { PointTooltip } from "./PointTooltip";
import { SidePanel } from "./SidePanel";

const cx = classNames.bind(styles);

export function ChartPage() {
	const [controls] = useChartControls();
	const { since, until, types } = controls;

	const [data, setData] = useState<UserMonthlyData[]>();
	useEffect(() => {
		getMonthlyData({ since, until, types }).then(setData);
	}, [since, until, types]);

	return (
		<div className={cx("chart-page")}>
			<TimeChartProvider data={data} {...controls} PointTooltip={PointTooltip}>
				<fieldset className={cx("chart")}>
					<legend>chart</legend>
					<TimeChart
						margin={{ top: 22, right: 34, bottom: 30, left: 70 }}
						axisLeft={{
							legendOffset: -54,
							legend:
								types.map((t) => categoryLabels[t]).join(" + ") || "Activities",
						}}
					/>
				</fieldset>
				<SidePanel>
					<Legend Entry={LegendEntry} className={cx("legend")} />
				</SidePanel>
			</TimeChartProvider>
			<ControlPanel />
		</div>
	);
}
