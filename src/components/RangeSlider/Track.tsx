import classNames from "classnames/bind";
import type { ComponentProps } from "react";
import { useCursorDragged } from "@/hooks/useCursorDragged";
import styles from "./RangeSlider.module.css";
import { Thumb } from "./Thumb";

const cx = classNames.bind(styles);

export interface TrackProps extends ComponentProps<"div"> {
	isDragged: boolean;
	min: number;
	max: number;
	domain: readonly unknown[];
	value: readonly [number, number];
	direction: "horizontal" | "vertical";
}

export function Track({
	min,
	max,
	domain,
	value,
	isDragged,
	direction,
	className,
	children,
	...props
}: TrackProps) {
	useCursorDragged(isDragged);

	const [from, to] = value;
	const total = Math.max(max - min, 1);
	const pre = ((from - min) / total) * 100;
	const selected = ((to - from) / total) * 100;

	return (
		<div
			{...props}
			className={cx("track", isDragged && "dragged", className, direction)}
		>
			<>
				<Thumb className={cx("limit")} kind="from" />
				<span className={cx("label", "min")}>{String(domain[min])}</span>
			</>

			{children}
			<div
				className={cx("bar")}
				style={{
					["--pre" as string]: `${pre}%`,
					["--selected" as string]: `${selected}%`,
				}}
			>
				<div className={cx("pre")} />
				<div className={cx("selected")} />
			</div>
			<Thumb className={cx("limit")} kind="to" />
			<span className={cx("label", "max")}>{String(domain[max])}</span>
		</div>
	);
}
