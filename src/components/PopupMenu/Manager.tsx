import {
	createContext,
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useState,
} from "react";
import type { Maybe, State } from "@/utils/types";

type GlobalContextValue = State<"activeMenuId", Maybe<string>>;

export const GlobalMenuContext = createContext<GlobalContextValue | null>(null);

export function Manager({ children }: { children: ReactNode }) {
	const [activeMenuId, setActiveMenuId] = useState<string>();

	useEffect(() => {
		if (!activeMenuId) {
			return;
		}

		const closeActiveMenu = ({ target }: Event) => {
			if (
				!(target instanceof HTMLElement) ||
				!target.closest(
					`:is([data-menu-id="${activeMenuId}"], [data-menu-trigger-id="${activeMenuId}"])`,
				)
			) {
				setActiveMenuId(undefined);
			}
		};

		document.addEventListener("pointerdown", closeActiveMenu);
		document.addEventListener("focus", closeActiveMenu);
		document.addEventListener("wheel", closeActiveMenu, { passive: true });
		return () => {
			document.removeEventListener("pointerdown", closeActiveMenu);
			document.removeEventListener("focus", closeActiveMenu);
			document.removeEventListener("wheel", closeActiveMenu);
		};
	}, [activeMenuId]);

	return (
		<GlobalMenuContext value={{ activeMenuId, setActiveMenuId }}>
			{children}
		</GlobalMenuContext>
	);
}

export function usePopupMenu() {
	const context = use(GlobalMenuContext);
	if (!context) {
		throw new Error("usePopupMenu must be used within a PopupMenuManager");
	}

	const { activeMenuId, setActiveMenuId } = context;
	const closeMenu = useCallback(
		() => setActiveMenuId(undefined),
		[setActiveMenuId],
	);

	return { activeMenuId, closeMenu };
}
