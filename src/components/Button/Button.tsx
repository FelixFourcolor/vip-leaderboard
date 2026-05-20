import classNames from "classnames/bind";
import type { ComponentProps } from "react";
import styles from "./Button.module.css";

const cx = classNames.bind(styles);

interface Props extends ComponentProps<"button"> {
	focused?: boolean;
}

export const Button = ({ className, focused, ...props }: Props) => {
	return <button className={cx("button", className, { focused })} {...props} />;
};
