import classNames from "classnames/bind";
import type { PointTooltipProps } from "@/components/TimeChart";
import { UserHeader } from "@/components/UserHeader";
import type { UserMonthlyStats } from "@/db/user";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function PointTooltip({
	data: { x, y },
	series,
	seriesColor,
	ref,
	style,
}: PointTooltipProps<UserMonthlyStats>) {
	return (
		<div
			ref={ref}
			style={{ ["--series-color" as string]: seriesColor, ...style }}
			className={cx("info-box", "tooltip")}
		>
			<UserHeader {...series} />
			<dl>
				<dt className={"sr-only"}>Month</dt>
				<dd>{x}</dd>
				<dt className={"sr-only"}>Count</dt>
				<dd>{y}</dd>
			</dl>
		</div>
	);
}
