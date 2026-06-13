import { useNavigate } from "@tanstack/react-router";
import classNames from "classnames/bind";
import { Activity, useEffect, useMemo, useRef, useState } from "react";
import { TimeChart } from "@/components/TimeChart";
import { activityLabels } from "@/db/activity";
import { getUserMonthlyCount, type UserMonthlyCount } from "@/db/user";
import { useDelay } from "@/hooks/useDelay";
import { useWindowSize } from "@/hooks/useWindowSize";
import { Header } from "../Header";
import { ChartControls, useChartControls } from "./ChartControls";
import styles from "./ChartPage.module.css";
import { LegendEntry } from "./LegendEntry";
import { PointTooltip } from "./PointTooltip";
import { SidePanel } from "./SidePanel";

const cx = classNames.bind(styles);

export function ChartPage() {
	const [options] = useChartControls();
	const { since, until, types, ranked, area } = options;

	const [data, setData] = useState<UserMonthlyCount[]>();
	useEffect(() => {
		getUserMonthlyCount({ since, until, types }).then(setData);
	}, [since, until, types]);

	const navigate = useNavigate();
	const ignoreScreenSizeWarning = useRef(false);
	useWindowSize({
		maxWidth: 500,
		onChange: (isMatched) => {
			if (!isMatched || ignoreScreenSizeWarning.current) {
				return;
			}
			if (
				window.confirm(
					"Screen is too small to effectively use this page. Exit to home?",
				)
			) {
				navigate({ to: "/" });
			} else {
				ignoreScreenSizeWarning.current = true;
			}
		},
	});

	const legend = useMemo(() => {
		const type = types.map((t) => activityLabels[t]).join(" + ");
		if (area || !ranked) {
			return type || "Activities";
		}
		return type ? `Rank by ${type.toLowerCase()}` : "Rank";
	}, [types, area, ranked]);

	return (
		<>
			<Header position="absolute" />
			<main className={cx("chart-page")}>
				<Activity mode={useDelay(0) ? "visible" : "hidden"}>
					<TimeChart
						{...options}
						data={data}
						PointTooltip={PointTooltip}
						renderDelay={100}
					>
						<fieldset className={cx("chart")}>
							<legend>chart</legend>
							<TimeChart.Chart
								margin={{ top: 18, right: 34, bottom: 34, left: 76 }}
								axisLeft={{ legendOffset: -60, legend }}
							/>
						</fieldset>
						<SidePanel>
							<TimeChart.Legend
								className={cx("legend")}
								Entry={LegendEntry}
								entriesGap={{ min: 24, max: 64 }}
							/>
						</SidePanel>
					</TimeChart>
					<ChartControls />
				</Activity>
			</main>
		</>
	);
}
