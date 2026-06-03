import classNames from "classnames/bind";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import styles from "./Toggle.module.css";

const cx = classNames.bind(styles);

interface ToggleProps extends Omit<ComponentProps<"label">, "onChange"> {
	value: boolean;
	onChange: (isOn: boolean) => void;
	customStyles?: Partial<Record<"container" | "slider", CSSProperties>>;
	className?: string;
	children?: ReactNode;
}

export function Toggle({
	value: isOn = false,
	onChange,
	customStyles = {},
	children,
	...props
}: ToggleProps) {
	return (
		<label {...props}>
			<input
				type="checkbox"
				checked={isOn}
				onChange={({ target: { checked } }) => {
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
