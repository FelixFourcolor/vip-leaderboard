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
	isActive: Pair<boolean>;
	isFocused: Pair<boolean>;
	setIsFocused: (yes: boolean) => void;
}

export function ThumbWrapper<Value>({
	rangeRef,
	values,
	index,
	domain,
	isActive,
	isFocused,
	setIsFocused,
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

	const showLabel = isMergedLabel
		? isActive.some(Boolean) || isFocused.some(Boolean)
		: isActive[index] || isFocused[index];

	return (
		<Thumb
			{...props}
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
			kind={index === 0 ? "from" : "to"}
			labelValue={labelValue}
			labelStyle={labelStyle}
			showLabel={showLabel}
		/>
	);
}
