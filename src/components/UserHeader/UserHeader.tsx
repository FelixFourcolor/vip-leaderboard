import classNames from "classnames/bind";
import { useState } from "react";
import type { User } from "@/db/user";
import styles from "./UserHeader.module.css";

const cx = classNames.bind(styles);

type Props = Partial<User> & {
	className?: string;
};
export function UserHeader({ name, avatarUrl, color, className }: Props) {
	const [imgError, setImgError] = useState(false);

	return (
		<div className={cx("header", className)}>
			{!imgError && (
				<img
					src={`https://cdn.discordapp.com/${avatarUrl}?size=24`}
					onError={() => setImgError(true)}
					className={cx("avatar")}
					alt={`${name}'s avatar`}
				/>
			)}
			<div style={color ? { color } : undefined} className={cx("name")}>
				{name}
			</div>
		</div>
	);
}
