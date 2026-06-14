import classNames from "classnames/bind";
import { useDrag } from "@/hooks/useDrag";
import styles from "./Resizer.module.css";

const cx = classNames.bind(styles);

type Props = {
	side: "left" | "right" | "top" | "bottom";
	onChange: (delta: number) => void;
	className?: string;
};

export function Resizer({ side, onChange, className }: Props) {
	const type = side === "left" || side === "right" ? "column" : "row";
	const direction =
		side === "right" || side === "bottom" ? "positive" : "negative";

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
