import { lastUpdated } from "virtual:db/last-updated";
import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { PopupMenu, usePopupMenu } from "@/components/PopupMenu";
import { RangeSlider } from "@/components/RangeSlider";
import { VALID_MONTHS } from "@/db/time";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { type RankingOptions, Route } from "@/routes/index";
import { offset, toYyyyMm, type YyyyMm } from "@/utils/time";
import type { Pair } from "@/utils/types";
import styles from "./HomePage.module.css";

const cx = classNames.bind(styles);

export function HomeControls() {
	const [options, setOptions] = useHomeControls();
	const { until, since } = options;

	const onDateChange = useCallback(
		([since, until]: Pair<YyyyMm>) => setOptions({ since, until }),
		[setOptions],
	);

	const [controlMenuId] = useState(() => crypto.randomUUID());
	const { activeMenuId, closeMenu } = usePopupMenu();
	const isMenuOpen = activeMenuId === controlMenuId;

	const [autoHide, setAutoHide] = useState(false);
	const floating = autoHide && !isMenuOpen;

	const isTouch = useIsTouchDevice((isTouch) => {
		if (isTouch) setAutoHide(false);
	});

	const resetButtonProps = {
		disabled: isEqual(options, defaultOptions),
		onClick: () => setOptions(defaultOptions),
		children: "Reset",
	};

	return (
		<div className={cx("controls-container", { floating })}>
			<div className={cx("controls")}>
				<RangeSlider
					className={cx("slider")}
					domain={VALID_MONTHS}
					selected={[since, until]}
					onChange={onDateChange}
					minDistance={0}
				/>
				{isTouch ? (
					<Button {...resetButtonProps} />
				) : (
					<PopupMenu menuId={controlMenuId}>
						<PopupMenu.Trigger>
							{(props) => <Button {...props}>Options</Button>}
						</PopupMenu.Trigger>
						<PopupMenu.Menu>
							<PopupMenu.Item
								selected={autoHide}
								setSelected={(selected) => {
									setAutoHide(selected);
									if (selected) {
										closeMenu();
									}
								}}
							>
								Auto-hide
							</PopupMenu.Item>
							<hr />
							<PopupMenu.Item
								{...resetButtonProps}
								stayOpenOnClick={autoHide}
							/>
						</PopupMenu.Menu>
					</PopupMenu>
				)}
			</div>
		</div>
	);
}

const defaultOptions = {
	until: toYyyyMm(lastUpdated),
	since: offset(lastUpdated, { years: -2, months: 1 }),
	sortBy: "total",
} satisfies Required<RankingOptions>;

export function useHomeControls() {
	const search = Route.useSearch();
	const options = useMemo(() => ({ ...defaultOptions, ...search }), [search]);

	const navigate = Route.useNavigate();
	const setOptions = useCallback(
		(options: RankingOptions) => {
			const search = mapValues(options, (v, k) =>
				isEqual(v, defaultOptions[k]) ? undefined : v,
			) as RankingOptions;
			navigate({ search, replace: true });
		},
		[navigate],
	);

	return [options, setOptions] as const;
}
