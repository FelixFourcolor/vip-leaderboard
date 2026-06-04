import classNames from "classnames/bind";
import { useDelay } from "@/hooks/useDelay";
import styles from "./LoadingSpinner.module.css";

const cx = classNames.bind(styles);

type Props = {
	size: number;
	thickness?: number;
	delay?: number;
};
export function LoadingSpinner({ size, thickness = 3, delay }: Props) {
	const visible = useDelay(delay) || delay === undefined;

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
