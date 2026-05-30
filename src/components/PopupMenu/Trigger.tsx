import type { JSX } from "react";
import { useLocalMenu } from "./PopupWrapper";

type Props = {
	children: (props: {
		onClick: () => void;
		ref: (node: HTMLElement | null) => void;
		focused: boolean;
	}) => JSX.Element | null;
};

export function Trigger({ children: Renderer }: Props) {
	const { menuId, isMenuOpen, setMenuOpen, triggerRef } = useLocalMenu();

	return (
		<Renderer
			onClick={() => setMenuOpen(!isMenuOpen)}
			ref={triggerRef}
			focused={isMenuOpen}
			data-menu-trigger-id={menuId}
		/>
	);
}
