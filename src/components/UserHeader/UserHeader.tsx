import classNames from "classnames/bind";
import { useState } from "react";
import type { UserData } from "@/db/user";
import styles from "./UserHeader.module.css";

const cx = classNames.bind(styles);

export function UserHeader({ name, avatarUrl, color }: Partial<UserData>) {
	const [imgError, setImgError] = useState(false);

	return (
		<div className={cx("header")}>
			{!imgError && (
				<img
					src={`https://cdn.discordapp.com/${avatarUrl}?size=24`}
					onError={() => setImgError(true)}
					className={cx("avatar")}
				/>
			)}
			<div style={{ color: color ?? undefined }} className={cx("name")}>
				{name}
			</div>
		</div>
	);
}
