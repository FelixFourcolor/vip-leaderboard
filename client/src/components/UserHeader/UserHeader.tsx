import classNames from "classnames/bind";
import type { UserData } from "@/db/endpoints";
import styles from "./UserHeader.module.css";

const cx = classNames.bind(styles);

export function UserHeader({
	name,
	avatarUrl,
	color,
}: Partial<NonNullable<UserData>>) {
	return (
		<div className={cx("header")}>
			{avatarUrl && (
				<img src={`${avatarUrl}?size=24`} className={cx("avatar")} />
			)}
			<div style={{ color }} className={cx("name")}>
				{name}
			</div>
		</div>
	);
}
