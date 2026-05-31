import classNames from "classnames/bind";
import type { ComponentProps, CSSProperties, RefObject } from "react";
import { type Range, useThumbOverlap } from "react-range";
import type { IThumbProps } from "react-range/lib/types";
import type { Pair } from "@/utils/types";
import styles from "./RangeSlider.module.css";

const cx = classNames.bind(styles);

type ThumbProps = ComponentProps<"div"> & {
	labelValue?: string;
	labelStyle?: CSSProperties;
	showLabel?: boolean;
	kind: "from" | "to";
};
export function Thumb({
	labelValue,
	labelStyle,
	showLabel,
	kind,
	className,
	...props
}: ThumbProps) {
	return (
		<div {...props} className={cx("thumb", kind, className)}>
			{labelValue != null && (
				<span
					className={cx("label", { hidden: !showLabel })}
					style={labelStyle}
				>
					{labelValue}
				</span>
			)}
		</div>
	);
}

export interface ThumbWrapperProps<Value> extends IThumbProps {
	rangeRef: RefObject<Range | null>;
	values: number[];
	index: number;
	domain: readonly Value[];
	autoHideLabel: boolean;
	isActive: Pair<boolean>;
	onFocus: () => void;
}

export function ThumbWrapper<Value>({
	rangeRef,
	values,
	index,
	domain,
	autoHideLabel,
	isActive,
	...props
}: ThumbWrapperProps<Value>) {
	let [labelValue, labelStyle] = useThumbOverlap(
		rangeRef.current,
		values,
		index,
		1, // step
		" - ", // separator (e.g. date - date)
		(value) => String(domain[parseInt(value, 10)]),
	);
	// fuck react-range's types, this is so stupid!
	labelValue = labelValue as string | undefined;
	labelStyle = labelStyle as CSSProperties | undefined;

	const isMergedLabel = labelValue?.includes(" - ");
	const showLabel =
		!autoHideLabel ||
		(isMergedLabel ? isActive.some(Boolean) : isActive[index]);

	return (
		<Thumb
			{...props}
			className={cx({ autoHideLabel })}
			kind={index === 0 ? "from" : "to"}
			labelValue={labelValue}
			labelStyle={labelStyle}
			showLabel={showLabel}
		/>
	);
}
