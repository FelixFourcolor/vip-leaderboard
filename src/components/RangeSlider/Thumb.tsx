import classNames from "classnames/bind";
import type { ComponentProps, CSSProperties, RefObject } from "react";
import { type Range, useThumbOverlap } from "react-range";
import type { IThumbProps } from "react-range/lib/types";
import type { Maybe } from "@/utils/types";
import styles from "./RangeSlider.module.css";

const cx = classNames.bind(styles);

type ThumbProps = ComponentProps<"div"> & {
	labelValue?: string;
	labelStyle?: CSSProperties;
	kind: "from" | "to";
};
export function Thumb({
	labelValue,
	labelStyle,
	kind,
	className,
	...props
}: ThumbProps) {
	return (
		<div {...props} className={cx("thumb", kind, className)}>
			{labelValue != null && (
				<span className={cx("label")} style={labelStyle}>
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
}

export function ThumbWrapper<Value>({
	rangeRef,
	values,
	index,
	domain,
	...props
}: ThumbWrapperProps<Value>) {
	let [labelValue, labelStyle] = useThumbOverlap(
		rangeRef.current,
		values,
		index,
		1, // step
		" - ", // separator (e.g. date - date)
		(value) => String(domain[Number(value)]),
	);
	// fuck react-range's types, this is so stupid!
	labelValue = labelValue as Maybe<string>;
	labelStyle = labelStyle as Maybe<CSSProperties>;

	return (
		<Thumb
			{...props}
			kind={index === 0 ? "from" : "to"}
			labelValue={labelValue}
			labelStyle={labelStyle}
		/>
	);
}
