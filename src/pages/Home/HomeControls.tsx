import classNames from "classnames/bind";
import { isEqual, mapValues } from "es-toolkit";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { PopupMenu, usePopupMenu } from "@/components/PopupMenu";
import { RangeSlider } from "@/components/RangeSlider";
import { ALL_MONTHS, LAST_MONTH, TWO_YEARS_AGO } from "@/db/time";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { type RankingOptions, Route } from "@/routes/index";
import type { YyyyMm } from "@/utils/time";
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
		onClick: () => setTimeout(() => setOptions(defaultOptions)),
		children: "Reset",
	};

	return (
		<div className={cx("controls-container", { floating })}>
			<div className={cx("controls")}>
				<RangeSlider
					className={cx("slider")}
					domain={ALL_MONTHS}
					selected={[since, until]}
					onChange={onDateChange}
					debounce={0}
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
							<PopupMenu.Item {...resetButtonProps} stayOpenOnClick />
						</PopupMenu.Menu>
					</PopupMenu>
				)}
			</div>
		</div>
	);
}

const defaultOptions = {
	since: TWO_YEARS_AGO,
	until: LAST_MONTH,
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
