import { useEffect, useState } from "react";

export function useControlled<T>(value: T | (() => T)) {
	const [state, setState] = useState(value);

	useEffect(() => setState(value), [value]);

	return [state, setState] as const;
}
