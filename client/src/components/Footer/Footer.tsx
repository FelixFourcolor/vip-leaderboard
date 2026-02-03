import { useQuery } from "@tanstack/react-query";
import classNames from "classnames/bind";
import styles from "./Footer.module.css";
import { ZackModeToggle } from "./ZackModeToggle";

const cx = classNames.bind(styles);

export function Footer() {
	const { data: lastUpdated } = useQuery({
		queryKey: ["lastUpdated"],
		queryFn: () =>
			fetch("/api/last-updated")
				.then((res) => res.json())
				.then((ts) => (ts ? new Date(ts) : undefined))
				.then((date) => date?.toLocaleString()),
	});

	return (
		<footer>
			<hr />
			<div className={cx("container")}>
				{lastUpdated && (
					<span className={cx("lastUpdated")}>
						Last updated: <span className={cx("timestamp")}>{lastUpdated}</span>
					</span>
				)}
				<ZackModeToggle />
			</div>
		</footer>
	);
}
