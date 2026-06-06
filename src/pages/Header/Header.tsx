import { LAST_UPDATE } from "virtual:db";
import { Link } from "@tanstack/react-router";
import classNames from "classnames/bind";
import { type CSSProperties, type RefObject, useEffect, useState } from "react";
import { Tooltip } from "@/components/Tooltip";
import { useWindowSize } from "@/hooks/useWindowSize";
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

		const eventTarget = container ?? window;
		eventTarget.addEventListener("scroll", handleScroll, { passive: true });
		return () => eventTarget.removeEventListener("scroll", handleScroll);
	}, [position, containerRef]);

	const isScreenSmall = useWindowSize({ maxWidth: 500 });

	// To keep the header position stable when switching
	const [style, setStyle] = useState<CSSProperties>();
	useEffect(() => {
		if (position === "absolute") {
			setStyle({ transition: "none" });
			setTimeout(() => setStyle(undefined));
		}
	}, [position]);

	return (
		<header
			style={style}
			className={cx("header", position, {
				floating: position === "absolute" || scrolled,
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
					<dd>{LAST_UPDATE.toLocaleDateString()}</dd>
				</dl>
			</div>
			<nav>
				<Link activeProps={{ className: cx("active") }} to="/">
					Home
				</Link>
				<Tooltip
					disabled={!isScreenSmall}
					trigger={(props) => (
						<Link
							{...props}
							activeProps={{ className: cx("active") }}
							to="/chart"
							disabled={isScreenSmall}
						>
							Chart
						</Link>
					)}
					content={(props) => (
						<div {...props} className={cx("tooltip")}>
							Screen is too small for this page
						</div>
					)}
				/>

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
