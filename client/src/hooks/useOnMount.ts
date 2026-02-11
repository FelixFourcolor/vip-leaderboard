import { useEffect } from "react";

export function useOnMount(effect: () => void) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: .
	useEffect(effect, []);
}
