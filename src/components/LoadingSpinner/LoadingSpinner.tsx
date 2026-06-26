import classNames from "classnames/bind";
import styles from "./LoadingSpinner.module.css";

const cx = classNames.bind(styles);

type Props = { size: number; thickness?: number };
export const LoadingSpinner = ({ size, thickness = 3 }: Props) => (
	<div
		style={{
			["--size" as string]: `${size}px`,
			["--thickness" as string]: `${thickness}px`,
		}}
		className={cx("spinner")}
	/>
);
