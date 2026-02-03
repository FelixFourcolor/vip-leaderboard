import classNames from "classnames/bind";
import type { MonthTickets, User } from "@/api/types";
import { UserHeader } from "@/components/UserHeader";
import styles from "./Tooltip.module.css";

const cx = classNames.bind(styles);

interface Props extends Omit<User, "rank">, MonthTickets {
	seriesColor: string;
	onMount: () => void;
}

export function Tooltip({
	seriesColor,
	month,
	count,
	onMount,
	...user
}: Props) {
	return (
		<div
			ref={onMount}
			style={{ ["--series-color" as string]: seriesColor }}
			className={cx("tooltip")}
		>
			<UserHeader {...user} />
			<div className={cx("detail")}>
				<span className={cx("label")}>Month:</span>
				<span className={cx("data")}>{month}</span>
				<br />
				<span className={cx("label")}>Tickets:</span>
				<span className={cx("data")}>{count}</span>
			</div>
		</div>
	);
}
