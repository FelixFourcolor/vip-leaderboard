import classNames from "classnames/bind";
import {
	type CSSProperties,
	type MouseEvent,
	type ReactNode,
	useEffect,
	useRef,
} from "react";
import { useResizePrivate } from "./Manager";
import styles from "./Resizer.module.css";

const cx = classNames.bind(styles);

type Props = {
	side: "left" | "right" | "top" | "bottom";
	onChange: (delta: number) => void;
	style?: CSSProperties;
	className?: string;
	children?: ReactNode;
};

export function Resizer({ side, onChange, className, ...rest }: Props) {
	const type = side === "left" || side === "right" ? "column" : "row";
	const direction =
		side === "right" || side === "bottom" ? "positive" : "negative";

	const { isResizing, delta, onResize } = useResizePrivate();

	const isResizingRef = useRef(false);
	const onMouseDown = ({ clientX, clientY }: MouseEvent) => {
		isResizingRef.current = true;
		onResize(type, type === "column" ? clientX : clientY);
	};
	useEffect(() => {
		if (!isResizing) {
			isResizingRef.current = false;
		}
	}, [isResizing]);

	useEffect(() => {
		if (isResizingRef.current) {
			const signedDelta = direction === "positive" ? delta : -delta;
			onChange(signedDelta);
		}
	}, [delta, direction, onChange]);

	return (
		<div
			data-is-active={isResizingRef.current && isResizing != null}
			onMouseDown={onMouseDown}
			className={cx(type, className)}
			{...rest}
		/>
	);
}
