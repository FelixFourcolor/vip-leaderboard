import { lastUpdated } from "virtual:db/last-updated";
import { Link } from "@tanstack/react-router";
import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import { Toggle } from "@/components/Toggle";
import { UserHeader } from "@/components/UserHeader";
import type { UserData } from "@/db/user";
import { getUser } from "@/db/user";
import { setIsZack, useIsZack } from "@/hooks/useIsZack";
import styles from "./Header.module.css";

const cx = classNames.bind(styles);

export function Header() {
	return (
		<header className={cx("header")}>
			<div className={cx("left")}>
				<h1>VIP leaderboard</h1>
				<span className={cx("last-updated")}>
					last update: {lastUpdated.toLocaleDateString()}
				</span>
			</div>
			<nav className={cx("nav")}>
				<Link
					className={cx("link")}
					activeProps={{ className: cx("active") }}
					to="/"
				>
					Home
				</Link>
				<Link
					className={cx("link")}
					activeProps={{ className: cx("active") }}
					to="/about"
				>
					About
				</Link>
			</nav>
			<div className={cx("right")}>
				<ZackToggle />
			</div>
		</header>
	);
}

function ZackToggle() {
	const isZack = useIsZack();
	const [zackData, setZackData] = useState<UserData | undefined>();
	useEffect(() => {
		getUser("zackwb").then(setZackData);
	}, []);

	const avatarUrl = zackData
		? `https://cdn.discordapp.com/${zackData.avatarUrl}?size=16`
		: undefined;
	// prefetch avatar to avoid delay when toggling
	useEffect(() => {
		if (avatarUrl) {
			const img = new Image();
			img.src = avatarUrl;
		}
	}, [avatarUrl]);

	const color = isZack ? (zackData?.color ?? undefined) : undefined;
	const image = isZack && avatarUrl ? `url("${avatarUrl}")` : undefined;

	return (
		<Toggle
			value={isZack}
			onChange={setIsZack}
			customStyles={{
				container: { backgroundColor: color },
				slider: { backgroundImage: image },
			}}
		>
			<UserHeader name="Light mode" color={color} />
		</Toggle>
	);
}

export default Header;
