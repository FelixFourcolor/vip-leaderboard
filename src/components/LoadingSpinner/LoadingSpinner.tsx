import classNames from "classnames/bind";
import { useEffect, useState } from "react";
import styles from "./LoadingSpinner.module.css";

const cx = classNames.bind(styles);

type Props = {
	size: number;
	thickness?: number;
	delay?: number;
};
export function LoadingSpinner({ size, thickness = 3, delay = 100 }: Props) {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setVisible(true), delay);
		return () => clearTimeout(timer);
	}, [delay]);

	if (visible) {
		return (
			<div
				style={{
					["--size" as string]: `${size}px`,
					["--thickness" as string]: `${thickness}px`,
				}}
				className={cx("spinner")}
			/>
		);
	}
}
