import { useEffect, useRef, useState } from "react";
import type { EitherOr } from "@/utils/types";

type Props = EitherOr<{ maxWidth: number }, { minWidth: number }> & {
	onChange?: (isMatched: boolean) => void;
};

export function useWindowSize({ maxWidth, minWidth, onChange }: Props) {
	const [matches, setMatches] = useState(false);
	const onChangeRef = useRef(onChange);

	const query = `(max-width: ${maxWidth}px), (min-width: ${minWidth}px)`;
	useEffect(() => {
		const mediaQuery = window.matchMedia(query);
		const matches = mediaQuery.matches;

		const listener = (e: { matches: boolean }) => {
			setMatches(e.matches);
			onChangeRef.current?.(e.matches);
		};
		listener({ matches: matches });

		mediaQuery.addEventListener("change", listener);
		return () => mediaQuery.removeEventListener("change", listener);
	}, [query]);

	return matches;
}
