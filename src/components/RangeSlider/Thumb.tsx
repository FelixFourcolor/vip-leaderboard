import classNames from "classnames/bind";
import type { ComponentProps, Ref } from "react";
import styles from "./RangeSlider.module.css";

const cx = classNames.bind(styles);

export type ThumbProps = ComponentProps<"div"> & {
	label?: unknown;
	hideLabel?: boolean;
	labelRef?: Ref<HTMLSpanElement>;
	kind: "from" | "to";
};

export function Thumb({
	label,
	hideLabel,
	labelRef,
	kind,
	className,
	...props
}: ThumbProps) {
	return (
		<div {...props} className={cx("thumb", kind, className)}>
			{label != null && (
				<span ref={labelRef} className={cx("label", { hidden: hideLabel })}>
					{String(label)}
				</span>
			)}
		</div>
	);
}
