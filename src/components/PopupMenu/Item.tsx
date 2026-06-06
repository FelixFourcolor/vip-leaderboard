import classNames from "classnames/bind";
import type { ComponentProps, ReactNode } from "react";
import { useSyncedState } from "@/hooks/useSyncedState";
import type { EitherOr, State } from "@/utils/types";
import styles from "./PopupMenu.module.css";
import { useLocalMenu } from "./PopupWrapper";

const cx = classNames.bind(styles);

type ItemProps = EitherOr<
	{ onClick: () => void; stayOpenOnClick?: boolean },
	State<"selected", boolean, { action: false }>
> & {
	disabled?: boolean;
	callbackDelay?: number | false;
	children: ReactNode;
	className?: string;
};

export function Item({
	onClick: clickCallback,
	stayOpenOnClick,
	selected: selectedExternal,
	setSelected: selectedCallback,
	disabled,
	callbackDelay = 0,
	className,
	children,
	...nativeProps
}: ItemProps & ComponentProps<"li">) {
	const { setMenuOpen } = useLocalMenu();
	const [selected, setSelected] = useSyncedState(selectedExternal);

	const onClick = () => {
		if (selectedCallback) {
			setSelected(!selected);
			if (callbackDelay !== false) {
				setTimeout(() => selectedCallback(!selected), callbackDelay);
			} else {
				selectedCallback(!selected);
			}
		} else {
			if (callbackDelay !== false) {
				setTimeout(clickCallback);
			} else {
				clickCallback();
			}
			if (!stayOpenOnClick) {
				setMenuOpen(false);
			}
		}
	};

	return (
		<li {...nativeProps} className={cx("item", { disabled })}>
			<CheckIcon className={cx("icon", { selected })} />
			<button
				type="button"
				onClick={onClick}
				disabled={disabled}
				className={className}
			>
				{children}
			</button>
		</li>
	);
}

const CheckIcon = ({ className }: { className?: string }) => (
	<svg
		aria-hidden
		viewBox="0 0 24 24"
		className={className}
		width="1em"
		height="1em"
	>
		<path
			fill="currentColor"
			d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
		/>
	</svg>
);
