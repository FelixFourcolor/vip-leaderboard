import { useEffect, useRef, useState } from "react";
import type { Maybe } from "@/utils/types";

export function useDelay(ms = 0) {
	const [isReady, setIsReady] = useState(ms === undefined);

	const timeout = useRef<Maybe<number>>(undefined);
	useEffect(() => {
		if (ms === undefined) {
			return;
		}
		clearTimeout(timeout.current);
		timeout.current = setTimeout(() => setIsReady(true), ms);
		return () => clearTimeout(timeout.current);
	}, [ms]);

	return isReady;
}
