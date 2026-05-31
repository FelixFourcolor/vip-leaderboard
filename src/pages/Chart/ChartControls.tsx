import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/Button";
import { PopupMenu } from "@/components/PopupMenu";
import { RangeSlider } from "@/components/RangeSlider";
import { activityIcons, activityLabels, activityTypes } from "@/db/activity";
import { ALL_MONTHS, LAST_MONTH, TWO_YEARS_AGO } from "@/db/time";
import { type ChartOptions, Route } from "@/routes/chart";
import type { YyyyMm } from "@/utils/time";
import type { Pair } from "@/utils/types";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

export function ChartControls() {
	const [options, setOptions] = useChartControls();
	const { until, since, cumulative, stacked, types } = options;

	const onDateChange = useCallback(
		([since, until]: Pair<YyyyMm>) => setOptions({ since, until }),
		[setOptions],
	);

	return (
		<fieldset>
			<legend>controls</legend>
			<div className={cx("control-panel")}>
				<RangeSlider
					className={cx("slider")}
					domain={ALL_MONTHS}
					selected={[since, until]}
					onChange={onDateChange}
					autoHideLabel
				/>

				<PopupMenu>
					<PopupMenu.Trigger>
						{(props) => <Button {...props}>Options</Button>}
					</PopupMenu.Trigger>
					<PopupMenu.Menu>
						<PopupMenu.Group title="Filter">
							{activityTypes.map((t) => (
								<PopupMenu.Item
									key={t}
									selected={types.includes(t)}
									setSelected={(selected) => {
										setTimeout(() => {
											if (selected) {
												setOptions({ types: [...types, t] });
											} else {
												setOptions({ types: types.filter((x) => x !== t) });
											}
										});
									}}
									className={cx("menu-item")}
								>
									<span>{activityLabels[t]}</span>
									<span aria-hidden className={cx("icon")}>
										{activityIcons[t]}
									</span>
								</PopupMenu.Item>
							))}
						</PopupMenu.Group>
						<hr />
						<PopupMenu.Group title="View">
							<PopupMenu.Item
								selected={cumulative}
								setSelected={(cumulative) => setOptions({ cumulative })}
								className={cx("menu-item")}
							>
								Cumulative
							</PopupMenu.Item>
							<PopupMenu.Item
								selected={stacked}
								setSelected={(stacked) => setOptions({ stacked })}
								className={cx("menu-item")}
							>
								Stacked
							</PopupMenu.Item>
						</PopupMenu.Group>
						<hr />
						<PopupMenu.Item
							disabled={isEqual(options, defaultOptions)}
							onClick={() => setTimeout(() => setOptions(defaultOptions), 0)}
							stayOpenOnClick
							className={cx("menu-item")}
						>
							Reset
						</PopupMenu.Item>
					</PopupMenu.Menu>
				</PopupMenu>
			</div>
		</fieldset>
	);
}

const defaultOptions = {
	since: TWO_YEARS_AGO,
	until: LAST_MONTH,
	cumulative: false,
	stacked: false,
	types: [],
} satisfies Required<ChartOptions>;

export function useChartControls() {
	const search = Route.useSearch();
	const options = useMemo(() => ({ ...defaultOptions, ...search }), [search]);

	const navigate = Route.useNavigate();
	const setOptions = useCallback(
		(options: ChartOptions) => {
			const search = mapValues(options, (v, k) =>
				isEqual(v, defaultOptions[k]) ? undefined : v,
			) as ChartOptions;
			navigate({ search, replace: true });
		},
		[navigate],
	);

	return [options, setOptions] as const;
}
