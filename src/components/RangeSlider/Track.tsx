import classNames from "classnames/bind";
import type { ComponentProps } from "react";
import { getTrackBackground } from "react-range";
import { useIsGrabbing } from "./Manager";
import styles from "./RangeSlider.module.css";
import { Thumb } from "./Thumb";

const cx = classNames.bind(styles);

export type TrackProps = ComponentProps<"div"> & {
	isDragged: boolean;
	min: number;
	max: number;
	domain: readonly unknown[];
	value: readonly [number, number];
};

export function Track({
	min,
	max,
	domain,
	value,
	isDragged,
	className,
	children,
	...divProps
}: TrackProps) {
	useIsGrabbing(isDragged);

	const [from, to] = value;

	return (
		<div className={cx("container", className)}>
			<div {...divProps} className={cx("track")}>
				{from !== 0 && <Thumb className={cx("limit")} kind="from" />}
				<span className={cx("label", "min")}>{String(domain[min])}</span>
				{children}
				<div
					className={cx("bar")}
					style={{
						background: getTrackBackground({
							values: value as any, // bad react-range types
							colors: [
								"var(--text-secondary)",
								"var(--accent)",
								"var(--text-secondary)",
							],
							min,
							max,
						}),
					}}
				/>
				{to !== max && <Thumb className={cx("limit")} kind="to" />}
				<span className={cx("label", "max")}>{String(domain[max])}</span>
			</div>
		</div>
	);
}
