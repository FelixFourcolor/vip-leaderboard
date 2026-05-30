import classNames from "classnames/bind";
import type { ReactNode } from "react";
import type { EitherOr, State } from "@/utils/types";
import styles from "./PopupMenu.module.css";
import { useLocalMenu } from "./PopupWrapper";

const cx = classNames.bind(styles);

type Props = EitherOr<
	{ onClick: () => void; stayOpenOnClick?: boolean },
	State<"selected", boolean, { action: false }>
> & {
	disabled?: boolean;
	children: ReactNode;
	className?: string;
};

export function Item({
	onClick,
	stayOpenOnClick,
	selected,
	setSelected,
	disabled,
	className,
	children,
}: Props) {
	const { setMenuOpen } = useLocalMenu();

	return (
		<li className={cx("item", { disabled })}>
			<CheckIcon className={cx("icon", { selected })} />
			<button
				type="button"
				onClick={() => {
					if (setSelected) {
						setSelected(!selected);
					} else {
						onClick();
						if (!stayOpenOnClick) {
							setMenuOpen(false);
						}
					}
				}}
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
