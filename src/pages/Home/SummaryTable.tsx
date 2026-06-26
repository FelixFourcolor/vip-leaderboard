import classNames from "classnames/bind";
import { useMemo } from "react";
import { DataBarTable } from "@/components/DataBarTable";
import {
	type ActivityStats,
	activityColors,
	activityIcons,
	activityLabels,
} from "@/db/activity";
import { FIRST_MONTH, LAST_MONTH, TWO_YEARS_AGO } from "@/db/time";
import { useHomeControls } from "./HomeControls";
import styles from "./HomePage.module.css";

const cx = classNames.bind(styles);

export function SummaryTable({ data }: { data: ActivityStats[] }) {
	const [{ until, since }] = useHomeControls();

	const timePeriod = useMemo(() => {
		if (since === until) {
			return since;
		}
		if (until === LAST_MONTH) {
			if (since === TWO_YEARS_AGO) {
				return "last 2 years";
			}
			if (since === FIRST_MONTH) {
				return "all time";
			}
		}
		return `${since} - ${until}`;
	}, [since, until]);

	return (
		<DataBarTable
			rows={data}
			primaryKey="type"
			title={`Summary (${timePeriod})`}
			columns={{
				type: {
					cell: ({ type }) => (
						<span className={cx("type-cell")}>
							{activityLabels[type]}
							{type !== "total" && (
								<span className={cx("icon")}>{activityIcons[type]}</span>
							)}
						</span>
					),
				},
				count: { cell: ({ data }) => data.count || "" },
			}}
			activeColumn="count"
			rowColors={activityColors}
			className={cx("table", "summary-table")}
		/>
	);
}
