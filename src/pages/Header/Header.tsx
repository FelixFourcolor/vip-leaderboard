import { lastUpdated } from "virtual:db/last-updated";
import { Link } from "@tanstack/react-router";
import classNames from "classnames/bind";
import { type RefObject, useEffect, useState } from "react";
import styles from "./Header.module.css";
import { ZackToggle } from "./ZackToggle";

const cx = classNames.bind(styles);

type Props = {
	position?: "sticky" | "absolute";
	containerRef?: RefObject<HTMLDivElement | null>;
};
export function Header({ position = "sticky", containerRef }: Props) {
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		if (position !== "sticky") {
			return;
		}

		const container = containerRef?.current;

		const handleScroll = () =>
			setScrolled((container ? container.scrollTop : window.scrollY) > 32);

		(container ?? window).addEventListener("scroll", handleScroll, {
			passive: true,
		});
		return () =>
			(container ?? window).removeEventListener("scroll", handleScroll);
	}, [position, containerRef]);

	return (
		<header
			className={cx("header", {
				scrolled,
				sticky: position === "sticky",
				absolute: position === "absolute",
			})}
		>
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
