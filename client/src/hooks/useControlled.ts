import { useEffect, useState } from "react";

export function useControlled<T>(value: T | (() => T)) {
	const [state, setState] = useState(value);

	useEffect(() => {
		if (value instanceof Function) {
			setState(value());
		} else {
			setState(value);
		}
	}, [value]);

	return [state, setState] as const;
}
