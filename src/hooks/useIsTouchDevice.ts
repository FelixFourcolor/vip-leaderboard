import { useEffect, useRef, useState } from "react";

export function useIsTouchDevice(onChange?: (isTouch: boolean) => void) {
	const [isTouch, setIsTouch] = useState(false);
	const onchangeRef = useRef(onChange);

	useEffect(() => {
		const query = window.matchMedia("(pointer: coarse)");
		const isTouch = query.matches;

		const listener = (e: { matches: boolean }) => {
			setIsTouch(e.matches);
			onchangeRef.current?.(e.matches);
		};
		listener({ matches: isTouch });

		query.addEventListener("change", listener);
		return () => query.removeEventListener("change", listener);
	}, []);

	return isTouch;
}
