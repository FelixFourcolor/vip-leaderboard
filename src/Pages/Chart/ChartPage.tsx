import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import { Legend, TimeChart, TimeChartProvider } from "@/components/TimeChart";
import { getMonthlyData, type UserMonthlyData } from "@/db/monthlyData";
import styles from "./ChartPage.module.css";
import { ControlPanel, useChartControls } from "./ControlPanel";
import { LegendEntry } from "./LegendEntry";
import { PointTooltip } from "./PointTooltip";
import { SidePanel } from "./SidePanel";

const cx = classNames.bind(styles);

export function ChartPage() {
	const [controls] = useChartControls();
	const { since, until } = controls;

	const [data, setData] = useState<UserMonthlyData[]>([]);
	useEffect(() => {
		getMonthlyData({ since, until }).then(setData);
	}, [since, until]);

	return (
		<div className={cx("chart-page")}>
			<TimeChartProvider data={data} {...controls} PointTooltip={PointTooltip}>
				<fieldset className={cx("chart")}>
					<legend>chart</legend>
					<TimeChart {...configs} />
				</fieldset>
				<SidePanel>
					<Legend Entry={LegendEntry} className={cx("legend")} />
				</SidePanel>
			</TimeChartProvider>
			<ControlPanel />
		</div>
	);
}

const configs = {
	margin: { top: 20, right: 28, bottom: 28, left: 70 },
	axisLeft: { legendOffset: -50, legend: "Activities" },
};
