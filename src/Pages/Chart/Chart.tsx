import classNames from "classnames/bind";
import type { ChartRendererProps } from "@/components/TimeChart";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function Chart(props: ChartRendererProps) {
	return (
		<fieldset className={cx("chart", props.className)}>
			<legend>chart</legend>
			<div {...props} />
		</fieldset>
	);
}
