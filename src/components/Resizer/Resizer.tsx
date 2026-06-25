import classNames from "classnames/bind";
import { useDrag } from "@/hooks/useDrag";
import type { OneOf } from "@/utils/types";
import styles from "./Resizer.module.css";

const cx = classNames.bind(styles);

type Props = {
	onChange: (delta: number) => void;
	className?: string;
} & OneOf<Record<"left" | "right" | "top" | "bottom", true>>;

export function Resizer({ left, right, bottom, onChange, className }: Props) {
	const type = left || right ? "column" : "row";
	const direction = right || bottom ? "positive" : "negative";

	const { isDragging, onMouseDown } = useDrag(`resize-${type}`, (delta) => {
		const signedDelta = direction === "positive" ? delta : -delta;
		onChange(signedDelta);
	});

	return (
		<div
			data-is-active={isDragging}
			onMouseDown={onMouseDown}
			className={cx("resizer", type, className)}
		>
			<hr />
		</div>
	);
}
