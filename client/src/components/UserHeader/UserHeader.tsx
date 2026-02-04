import classNames from "classnames/bind";
import type { User } from "@/api/types";
import styles from "./UserHeader.module.css";

const cx = classNames.bind(styles);

export function UserHeader({ name, avatarUrl, color }: Partial<User>) {
	return (
		<div
			style={{ ["--user-color" as string]: color ?? "var(--text-primary)" }}
			className={cx("header")}
		>
			{avatarUrl && (
				<img
					src={`${avatarUrl}?size=24`}
					alt={`${name}'s avatar`}
					className={cx("avatar")}
				/>
			)}
			<div className={cx("name")}>{name}</div>
		</div>
	);
}
