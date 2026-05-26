import { useEffect, useRef, useState } from "react";

export function useDelay(ms: number = 0) {
	const [isReady, setIsReady] = useState(false);

	const timeout = useRef<number | undefined>(undefined);
	useEffect(() => {
		clearTimeout(timeout.current);
		timeout.current = setTimeout(() => setIsReady(true), ms);
		return () => clearTimeout(timeout.current);
	}, [ms]);

	return isReady;
}
