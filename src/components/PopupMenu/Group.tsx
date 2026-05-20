import classNames from "classnames/bind";
import type { ReactNode } from "react";
import styles from "./PopupMenu.module.css";

const cx = classNames.bind(styles);

type Props = {
	title: string;
	children: ReactNode;
};

export function Group({ title, children }: Props) {
	return (
		<>
			<h2 className={cx("title")}>{title}</h2>
			{children}
		</>
	);
}
