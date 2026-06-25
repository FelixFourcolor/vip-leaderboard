import { throttle } from "es-toolkit";
import { useEffect, useRef } from "react";

export function useThrottle<F extends (...args: any[]) => void>(
	f: F,
	ms: number,
) {
	const throttledRef = useRef(f);

	useEffect(() => {
		const throttledF = throttle(f, ms, { edges: ["leading"] });
		throttledRef.current = throttledF as any as F;
		return () => throttledF.cancel();
	}, [f, ms]);

	return throttledRef.current;
}
