import classNames from "classnames/bind";
import { type ReactNode, useCallback, useState } from "react";
import { Resizer } from "@/components/Resizer";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function SidePanel({ children }: { children: ReactNode }) {
	const [legendWidth, setLegendWidth] = useState(139);
	const resizeWidth = useCallback((delta: number) => {
		setLegendWidth((current) => Math.max(Math.min(current + delta, 260), 90));
	}, []);

	return (
		<>
			<fieldset
				style={{ ["--legend-width" as string]: `${legendWidth}px` }}
				className={cx("side-panel")}
			>
				<legend>rankings</legend>
				{children}
			</fieldset>
			<Resizer
				side="left"
				onChange={resizeWidth}
				className={cx("legend-resizer")}
			/>
		</>
	);
}
