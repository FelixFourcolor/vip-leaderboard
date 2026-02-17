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
	element: (props: { ref: Ref<any> }) => JSX.Element;
	content: (props: { ref: Ref<any>; style: CSSProperties }) => JSX.Element;
	offset?: number;
	padding?: number;
};

export function Tooltip({
	element: Element,
	content: Content,
	offset = 4,
	padding = 8,
}: Props) {
	const { refs, floatingStyles } = useFloating({
		placement: "top",
		strategy: "fixed",
		middleware: [
			offsetMiddleware(offset),
			flip({ padding }),
			shift({ padding }),
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
