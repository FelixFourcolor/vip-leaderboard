import classNames from "classnames/bind";
import type { ComponentProps } from "react";
import styles from "./Button.module.css";

const cx = classNames.bind(styles);
type Props = ComponentProps<"button">;

export const Button = ({ className, ...props }: Props) => {
	return <button className={cx("button", className)} {...props} />;
};
