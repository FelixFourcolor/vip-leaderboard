import classNames from "classnames/bind";
import { useCallback, useState } from "react";
import { Resizer } from "@/components/Resizer";
import type { LegendContainerProps } from "@/components/TimeChart";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function SidePanel(props: LegendContainerProps) {
	const [legendWidth, setLegendWidth] = useState(144);
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
				<div className={cx("legend")} {...props} />
			</fieldset>
			<Resizer
				side="left"
				onChange={resizeWidth}
				className={cx("legend-resizer")}
			>
				<div />
			</Resizer>
		</>
	);
}
