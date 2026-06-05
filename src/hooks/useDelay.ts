import { useEffect, useRef, useState } from "react";
import type { Maybe } from "@/utils/types";

export function useDelay(ms: number = 0) {
	const [isReady, setIsReady] = useState(false);

	const timeout = useRef<Maybe<number>>(undefined);
	useEffect(() => {
		clearTimeout(timeout.current);
		timeout.current = setTimeout(() => setIsReady(true), ms);
		return () => clearTimeout(timeout.current);
	}, [ms]);

	return isReady;
}
