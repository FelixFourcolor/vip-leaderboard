import classNames from "classnames/bind";
import type { ReactNode } from "react";
import styles from "./PopupMenu.module.css";
import { useLocalMenu } from "./PopupWrapper";

const cx = classNames.bind(styles);

type Props = {
	children: ReactNode;
	className?: string;
};

export function Menu({ className, children }: Props) {
	const { menuId, isMenuOpen, menuStyles, menuRef } = useLocalMenu();

	if (isMenuOpen) {
		return (
			<menu
				style={menuStyles}
				ref={menuRef}
				className={cx("popup-menu", className)}
				data-menu-id={menuId}
			>
				{children}
			</menu>
		);
	}
}
