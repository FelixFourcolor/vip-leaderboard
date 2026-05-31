import { useEffect, useRef, useState } from "react";
import type { AtLeastOneOf } from "@/utils/types";

type Options = AtLeastOneOf<{
	maxWidth: number;
	minWidth: number;
}> & { onChange?: (isMatched: boolean) => void };

export function useWindowSize({ maxWidth, minWidth, onChange }: Options) {
	const [matches, setMatches] = useState(false);
	const onChangeRef = useRef(onChange);

	useEffect(() => {
		const query = window.matchMedia(
			(() => {
				if (maxWidth && minWidth) {
					return `(max-width: ${maxWidth}px) and (min-width: ${minWidth}px)`;
				}
				if (maxWidth) {
					return `(max-width: ${maxWidth}px)`;
				}
				if (minWidth) {
					return `(min-width: ${minWidth}px)`;
				}
				throw new Error("Either maxWidth or minWidth must be provided");
			})(),
		);
		const matches = query.matches;

		const listener = (e: { matches: boolean }) => {
			setMatches(e.matches);
			onChangeRef.current?.(e.matches);
		};
		listener({ matches: matches });

		query.addEventListener("change", listener);
		return () => query.removeEventListener("change", listener);
	}, [maxWidth, minWidth]);

	return matches;
}
