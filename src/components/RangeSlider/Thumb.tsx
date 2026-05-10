import classNames from "classnames/bind";
import {
	type ComponentProps,
	type Ref,
	useEffect,
	useRef,
	useState,
} from "react";
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
	const prevLabelRef = useRef(label);
	const timeoutRef = useRef<number | undefined>(undefined);
	const [isDragging, setIsDragging] = useState(false);

	useEffect(() => {
		if (label === prevLabelRef.current) {
			return;
		}
		prevLabelRef.current = label;

		setIsDragging(true);
		clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => setIsDragging(false), 2000);
	}, [label]);

	return (
		<div {...props} className={cx("thumb", kind, className)}>
			{label != null && (
				<span
					ref={labelRef}
					className={cx("label", { hidden: hideLabel || !isDragging })}
				>
					{String(label)}
				</span>
			)}
		</div>
	);
}
