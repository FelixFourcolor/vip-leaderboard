import { useRef } from "react";

export function useLastDefined<T>(value: T | undefined): T | undefined {
	const ref = useRef<T | undefined>(undefined);

	if (value !== undefined) {
		ref.current = value;
	}

	return value ?? ref.current;
}
