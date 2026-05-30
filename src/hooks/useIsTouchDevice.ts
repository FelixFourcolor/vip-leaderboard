import { useEffect, useRef, useState } from "react";

export function useIsTouchDevice(onChange?: (isTouch: boolean) => void) {
	const [isTouch, setIsTouch] = useState(false);
	const onchangeRef = useRef(onChange);

	useEffect(() => {
		const query = window.matchMedia("(pointer: coarse)");
		setIsTouch(query.matches);
		onchangeRef.current?.(query.matches);

		const listener = (e: MediaQueryListEvent) => setIsTouch(e.matches);
		query.addEventListener("change", listener);
		return () => query.removeEventListener("change", listener);
	}, []);

	return isTouch;
}
