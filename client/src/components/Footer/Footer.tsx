import classNames from "classnames/bind";
import { useGetLastUpdated } from "@/api/hooks";
import { Toggle } from "@/components/Toggle";
import { UserHeader } from "@/components/UserHeader";
import { useZackMode } from "@/hooks/useZackMode";
import styles from "./Footer.module.css";

const cx = classNames.bind(styles);

export function Footer() {
	const lastUpdated = useGetLastUpdated()?.toLocaleString(undefined, {
		timeZone: "UTC",
	});
	return (
		<footer>
			<hr />
			<div className={cx("container")}>
				{lastUpdated && <span>Last updated: {lastUpdated}</span>}
				<ZackModeToggle />
			</div>
		</footer>
	);
}

function ZackModeToggle() {
	const [isZack, setIsZack] = useZackMode();
	const color = isZack ? "#68D5F8" : undefined;
	const avatarUrl =
		"https://cdn.discordapp.com/avatars/1000499951597523125/54c74dd3bf04d27bd73479a1f9935a52.png?size=16";

	return (
		<Toggle
			value={isZack}
			onChange={setIsZack}
			customStyles={{
				container: {
					backgroundColor: color,
				},
				slider: {
					backgroundImage: isZack ? `url("${avatarUrl}")` : undefined,
				},
			}}
		>
			<UserHeader name="Light mode" color={color} />
		</Toggle>
	);
}
