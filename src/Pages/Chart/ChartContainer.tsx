import classNames from "classnames/bind";
import type { ChartContainerProps } from "@/components/TimeChart";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function ChartContainer(props: ChartContainerProps) {
	return (
		<fieldset className={cx("chart", props.className)}>
			<legend>chart</legend>
			<div {...props} />
		</fieldset>
	);
}
