import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import { TimeChart } from "@/components/TimeChart";
import { getMonthlyData, type UserMonthlyData } from "@/db/monthlyData";
import { Chart } from "./Chart";
import styles from "./ChartPage.module.css";
import { ControlPanel, useChartControls } from "./ControlPanel";
import { LegendEntry } from "./LegendEntry";
import { PointTooltip } from "./PointTooltip";
import { SidePanel } from "./SidePanel";

const cx = classNames.bind(styles);

export function ChartPage() {
	const [controls] = useChartControls();
	const { since, until } = controls;

	const [chartData, setChartData] = useState<UserMonthlyData[]>([]);
	useEffect(() => {
		getMonthlyData({ since, until }).then(setChartData);
	}, [since, until]);

	return (
		<div className={cx("chart-page")}>
			<TimeChart
				data={chartData}
				yAxisTitle="Units of work"
				{...controls}
				Renderer={Chart}
				PointTooltip={PointTooltip}
				legend={{ Renderer: SidePanel, Entry: LegendEntry }}
			/>
			<ControlPanel />
		</div>
	);
}
