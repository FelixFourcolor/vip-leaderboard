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
	type: "column" | "row";
	direction: "positive" | "negative";
	onChange: (delta: number) => void;
	style?: CSSProperties;
	className?: string;
	children?: ReactNode;
};

export function Resizer({
	type,
	direction,
	onChange,
	className,
	...rest
}: Props) {
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
