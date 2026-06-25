import classNames from "classnames/bind";
import { useCallback, useMemo, useState } from "react";
import { Resizer } from "@/components/Resizer";
import { SearchBar } from "@/components/SearchBar";
import { TimeChart, useChart } from "@/components/TimeChart";
import type { UserMonthlyCount } from "@/db/user";
import styles from "./ChartPage.module.css";
import { LegendEntry } from "./LegendEntry";

const cx = classNames.bind(styles);

export function SidePanel() {
	const { seriesData, renderReady, setActiveSeries, setEnableHover } =
		useChart<UserMonthlyCount>();

	const [legendWidth, setLegendWidth] = useState(164);
	const resizeWidth = useCallback((delta: number) => {
		setLegendWidth((current) => Math.max(Math.min(current + delta, 305), 121));
	}, []);

	const suggestions = useMemo(() => {
		if (!seriesData) {
			return [];
		}
		return Object.values(
			Object.fromEntries(
				seriesData
					.flatMap((user) => [user.id, user.name])
					.map((value) => [value.toLowerCase(), value]),
			),
		);
	}, [seriesData]);
	const nameToUserIdMap = useMemo(() => {
		if (!seriesData) {
			return;
		}
		return Object.fromEntries(
			seriesData.flatMap((user) => [
				[user.id, user.id],
				[user.name, user.id],
			]),
		);
	}, [seriesData]);

	return (
		<>
			<fieldset
				style={{ ["--legend-width" as string]: `${legendWidth}px` }}
				className={cx("side-panel")}
			>
				<legend>rankings</legend>
				{renderReady && (
					<SearchBar
						placeholder="Search user.."
						onChange={(name) => {
							const userId = nameToUserIdMap?.[name];
							if (userId) {
								// momentarily disable hover to avoid conflict
								setEnableHover(false);
								setActiveSeries(userId);
								setTimeout(() => setEnableHover(true), 0);
							}
						}}
						suggestions={suggestions}
						className={cx("search-bar")}
					/>
				)}
				<TimeChart.Legend
					vertical
					Entry={LegendEntry}
					entriesGap={{ min: 24, max: 64 }}
					className={cx("legend")}
				/>
			</fieldset>
			<Resizer left onChange={resizeWidth} className={cx("legend-resizer")} />
		</>
	);
}
