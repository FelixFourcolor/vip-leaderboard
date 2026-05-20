import {
	autoUpdate,
	flip,
	offset as offsetMiddleware,
	shift,
	useFloating,
} from "@floating-ui/react";
import type { CSSProperties, JSX, Ref } from "react";
import { createPortal } from "react-dom";

type Props = {
	element: (props: { ref: Ref<any> }) => JSX.Element | null;
	content: (props: { ref: Ref<any>; style: CSSProperties }) => JSX.Element;
	offset?: number;
};

export function Tooltip({
	element: Element,
	content: Content,
	offset = 4,
}: Props) {
	const { refs, floatingStyles } = useFloating({
		placement: "top",
		strategy: "absolute",
		middleware: [
			offsetMiddleware(offset),
			flip({ padding: 8 }),
			shift({ padding: 8 }),
		],
		whileElementsMounted: autoUpdate,
	});

	return (
		<>
			<Element ref={refs.setReference} />
			{createPortal(
				<Content ref={refs.setFloating} style={floatingStyles} />,
				document.body,
			)}
		</>
	);
}
