import type { MonthTickets, User } from "@/types";
import style from "./Tooltip.module.css";

interface Props extends Omit<User, "rank">, MonthTickets {
	seriesColor: string;
	onMount: () => void;
}

export function Tooltip({
	name,
	color,
	avatarUrl,
	seriesColor,
	month,
	count,
	onMount,
}: Props) {
	return (
		<div
			ref={onMount}
			style={{
				["--user-color" as string]: color,
				["--series-color" as string]: seriesColor,
			}}
			className={style.tooltip}
		>
			<div className={style.user}>
				<img
					src={avatarUrl}
					alt={`${name}'s avatar`}
					className={style.avatar}
				/>
				<div className={style.name}>{name}</div>
			</div>
			<div className={style.detail}>
				<span className={style.label}>Month:</span>
				<span className={style.data}>{month}</span>
				<br />
				<span className={style.label}>Tickets:</span>
				<span className={style.data}>{count}</span>
			</div>
		</div>
	);
}
