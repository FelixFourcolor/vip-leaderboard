import classNames from "classnames/bind";
import type { CSSProperties, ReactNode } from "react";
import { useControlled } from "@/hooks/useControlled";
import styles from "./Toggle.module.css";

const cx = classNames.bind(styles);

interface ToggleProps {
	value?: boolean;
	onChange: (isOn: boolean) => void;
	customStyles?: Partial<Record<"container" | "slider", CSSProperties>>;
	className?: string;
	children?: ReactNode;
}

export function Toggle({
	value = false,
	onChange,
	customStyles = {},
	children,
	className,
	...props
}: ToggleProps) {
	const [isOn, setIsOn] = useControlled(value);

	return (
		<label {...props} className={cx("container", className)}>
			<input
				type="checkbox"
				checked={isOn}
				onChange={({ target: { checked } }) => {
					setIsOn(checked);
					onChange(checked);
				}}
			/>
			<div className={cx("toggle", { isOn })} style={customStyles.container}>
				<div className={cx("dummy")} />
				<div className={cx("slider")} style={customStyles.slider}></div>
			</div>
			{children}
		</label>
	);
}
