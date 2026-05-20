import { lastUpdated } from "virtual:db/last-updated";
import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/Button";
import { PopupMenu } from "@/components/PopupMenu";
import { RangeSlider } from "@/components/RangeSlider";
import { type ActivityType, activityTypes } from "@/db/schema";
import { Route } from "@/routes/index";
import { monthsInRange, offset, toYyyyMm, type YyyyMm } from "@/utils/time";
import styles from "./ChartPage.module.css";

const cx = classNames.bind(styles);

// Earliest month with meaningful data.
// Kinda hard to define "meaningful",
// so just hardcode a value instead of querying it
const startDate = "2020-01";
const VALID_MONTHS = monthsInRange(startDate, lastUpdated);

export function ControlPanel() {
	const [params, setParams] = useChartControls();
	const { until, since, cumulative, stacked, types } = params;

	const onDateChange = useCallback(
		([since, until]: readonly [YyyyMm, YyyyMm]) => setParams({ since, until }),
		[setParams],
	);

	return (
		<fieldset tabIndex={0}>
			<legend>controls</legend>
			<div className={cx("control-panel")}>
				<RangeSlider
					className={cx("slider")}
					domain={VALID_MONTHS}
					selected={[since, until]}
					onChange={onDateChange}
					minDistance={1}
				/>

				<PopupMenu>
					<PopupMenu.Trigger>
						{(props) => <Button {...props}>Options</Button>}
					</PopupMenu.Trigger>
					<PopupMenu.Menu>
						<PopupMenu.Group title="Filter">
							{activityTypes.map((t, i) => (
								<PopupMenu.Item
									key={t}
									selected={types.includes(t)}
									setSelected={(selected) => {
										if (selected) {
											// insert t back to its original position, the order matters because
											// "reset" relies on it to determine whether there are changes
											setParams({ types: types.toSpliced(i, 0, t) });
										} else {
											setParams({ types: types.filter((x) => x !== t) });
										}
									}}
									className={cx("menu-item")}
								>
									<span className={cx("label")}>{categoryLabels[t]}</span>
									<span className={cx("icon")}>{categoryIcons[t]}</span>
								</PopupMenu.Item>
							))}
						</PopupMenu.Group>
						<hr />
						<PopupMenu.Group title="View">
							<PopupMenu.Item
								selected={cumulative}
								setSelected={(cumulative) => setParams({ cumulative })}
								className={cx("menu-item")}
							>
								Cumulative
							</PopupMenu.Item>
							<PopupMenu.Item
								selected={stacked}
								setSelected={(stacked) => setParams({ stacked })}
								className={cx("menu-item")}
							>
								Stacked
							</PopupMenu.Item>
						</PopupMenu.Group>
						<hr />
						<PopupMenu.Item
							disabled={isEqual(params, defaultParams)}
							onClick={() => setParams(defaultParams)}
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

const defaultParams = {
	until: toYyyyMm(lastUpdated),
	since: offset(lastUpdated, { years: -2, months: 1 }),
	cumulative: false,
	stacked: false,
	types: [] as ActivityType[],
};

export function useChartControls() {
	const search = Route.useSearch();
	const params = useMemo(() => ({ ...defaultParams, ...search }), [search]);

	const navigate = Route.useNavigate();

	const setParams = useCallback(
		(update: Partial<typeof params>) => {
			const search = mapValues(update, (v, k) =>
				v !== defaultParams[k] ? v : undefined,
			) as typeof update;
			navigate({ search, replace: true });
		},
		[navigate],
	);

	return [params, setParams] as const;
}

export const categoryLabels = {
	ticket: "Tickets",
	warning: "Warnings",
} satisfies Record<ActivityType, string>;

const categoryIcons = {
	ticket: "✅",
	warning: "⚠️",
} satisfies Record<ActivityType, string>;
