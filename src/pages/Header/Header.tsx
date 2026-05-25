import { lastUpdated } from "virtual:db/last-updated";
import { Link } from "@tanstack/react-router";
import classNames from "classnames/bind";
import styles from "./Header.module.css";
import { ZackToggle } from "./ZackToggle";

const cx = classNames.bind(styles);

export function Header() {
	return (
		<header className={cx("header")}>
			<div>
				<img
					src="./icon.png"
					alt="VIP leaderboard logo"
					className={cx("logo")}
				/>
				<h1>VIP leaderboard</h1>
				<dl>
					<dt>Last update</dt>
					<dd>{lastUpdated.toLocaleDateString()}</dd>
				</dl>
			</div>
			<nav>
				<Link activeProps={{ className: cx("active") }} to="/">
					Home
				</Link>
				<Link activeProps={{ className: cx("active") }} to="/chart">
					Chart
				</Link>
				<Link activeProps={{ className: cx("active") }} to="/about">
					About
				</Link>
			</nav>
			<div>
				<ZackToggle />
				<a
					href="https://github.com/felixfourcolor/vip-leaderboard"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img
						className={cx("github-icon")}
						src="https://unpkg.com/@lobehub/icons-static-svg@1.90.0/icons/github.svg"
						alt="GitHub"
					/>
				</a>
			</div>
		</header>
	);
}
