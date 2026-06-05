import classNames from "classnames/bind";
import { useState } from "react";
import type { User } from "@/db/user";
import styles from "./UserHeader.module.css";

const cx = classNames.bind(styles);

type Props = Partial<User> & {
	className?: string;
};
export function UserHeader({ name, avatarUrl, color, className }: Props) {
	const [isAvatarUrlValid, setAvatarUrlValid] = useState(
		() => avatarUrl && !invalidAvatarURLs.has(avatarUrl),
	);

	return (
		<div className={cx("header", className)}>
			{avatarUrl && isAvatarUrlValid && (
				<img
					src={`https://cdn.discordapp.com/${avatarUrl}?size=24`}
					onError={() => {
						setAvatarUrlValid(false);
						invalidAvatarURLs.add(avatarUrl);
					}}
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

const invalidAvatarURLs: Set<string> = new Set();
