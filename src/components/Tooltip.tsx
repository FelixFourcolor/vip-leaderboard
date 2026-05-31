import {
	autoUpdate,
	flip,
	offset as offsetMiddleware,
	type Placement,
	shift,
	useFloating,
} from "@floating-ui/react";
import type { CSSProperties, JSX, Ref } from "react";
import { createPortal } from "react-dom";
import { useSyncedState } from "@/hooks/useSyncedState";

type TooltipTriggerProps = {
	ref: Ref<any>;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
};

export type TooltipContentProps = {
	ref?: Ref<any>;
	style?: CSSProperties;
};

type Props = {
	trigger: (props: TooltipTriggerProps) => JSX.Element | null;
	content: (props: TooltipContentProps) => JSX.Element;
	offset?: number;
	placement?: Placement;
	open?: boolean;
	disabled?: boolean;
};

export function Tooltip({
	trigger: Trigger,
	content: Content,
	placement,
	offset = 4,
	open,
	disabled,
}: Props) {
	const { refs, floatingStyles } = useFloating({
		placement,
		strategy: "absolute",
		middleware: [
			offsetMiddleware(offset),
			flip({ padding: 8 }),
			shift({ padding: 8 }),
		],
		whileElementsMounted: autoUpdate,
	});

	const [isOpen, setIsOpen] = useSyncedState(open ?? false);

	const hoverEvents = {
		onMouseEnter: () => setIsOpen(true),
		onMouseLeave: () => setIsOpen(false),
	};

	return (
		<>
			<Trigger
				ref={refs.setReference}
				{...(open === undefined && !disabled ? hoverEvents : undefined)}
			/>
			{isOpen &&
				createPortal(
					<Content ref={refs.setFloating} style={floatingStyles} />,
					document.body,
				)}
		</>
	);
}
