import {
	autoUpdate,
	flip,
	offset as offsetMiddleware,
	type Placement,
	shift,
	useFloating,
} from "@floating-ui/react";
import {
	type CSSProperties,
	createContext,
	use,
	useCallback,
	useState,
} from "react";
import { GlobalMenuContext } from "./Manager";

interface LocalContextValue {
	menuId: string;
	menuStyles: CSSProperties;
	menuRef: (node: HTMLElement | null) => void;
	triggerRef: (node: HTMLElement | null) => void;
}

const LocalMenuContext = createContext<LocalContextValue | null>(null);

type Props = {
	menuId?: string;
	placement?: Placement;
	offset?: number;
	children?: React.ReactNode;
};

export function Wrapper({
	menuId: menuIdProp,
	children,
	placement,
	offset = 8,
}: Props) {
	const [menuId] = useState(() => menuIdProp || crypto.randomUUID());

	const { refs, floatingStyles } = useFloating({
		strategy: "absolute",
		placement,
		middleware: [
			offsetMiddleware(offset),
			flip({ padding: 8 }),
			shift({ padding: 8 }),
		],
		whileElementsMounted: autoUpdate,
	});

	return (
		<LocalMenuContext
			value={{
				menuId,
				menuStyles: floatingStyles,
				menuRef: refs.setFloating,
				triggerRef: refs.setReference,
			}}
		>
			{children}
		</LocalMenuContext>
	);
}

export function usePopupMenu() {
	const globalContext = use(GlobalMenuContext);
	if (!globalContext) {
		throw new Error("usePopupMenu must be used within a PopupMenuManager");
	}
	const { activeMenuId, setActiveMenuId } = globalContext;

	const localContext = use(LocalMenuContext);
	if (!localContext) {
		throw new Error("usePopupMenu must be used within a PopupMenu");
	}
	const { menuId, ...menuConfigs } = localContext;

	const isMenuOpen = activeMenuId === localContext.menuId;

	const setMenuOpen = useCallback(
		(open: boolean) => setActiveMenuId(open ? menuId : undefined),
		[setActiveMenuId, menuId],
	);

	return { menuId, isMenuOpen, setMenuOpen, ...menuConfigs };
}
