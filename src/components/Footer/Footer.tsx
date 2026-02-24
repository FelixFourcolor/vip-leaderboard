import { lastUpdated } from "virtual:db/last-updated";
import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import { Toggle } from "@/components/Toggle";
import { UserHeader } from "@/components/UserHeader";
import type { UserData } from "@/db/user";
import { getUser } from "@/db/user";
import { useZackMode } from "@/hooks/useZackMode";
import styles from "./Footer.module.css";

const cx = classNames.bind(styles);

export function Footer() {
	const lastUpdatedStr = lastUpdated.toLocaleString(undefined, {
		timeZone: "UTC",
	});
	return (
		<footer>
			<hr />
			<div className={cx("container")}>
				<span>Last update: {lastUpdatedStr} (UTC)</span>
				<ZackModeToggle />
			</div>
		</footer>
	);
}

function ZackModeToggle() {
	const [isZack, setIsZack] = useZackMode();
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
