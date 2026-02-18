import { type Dispatch, useCallback } from "react";
import { useControlled } from "@/hooks/useControlled";
import { BaseSlider } from "./BaseSlider";

type SliderProps<Value> = {
	domain: readonly Value[];
	value: Value;
	onChange: Dispatch<Value>;
	direction?: "horizontal" | "vertical";
	className?: string;
};

export function Slider<Value>({
	domain,
	value,
	onChange,
	...props
}: SliderProps<Value>) {
	const [index, setIndex] = useControlled(
		useCallback(() => domain.indexOf(value), [domain, value]),
	);

	const onCommit = useCallback(
		(index: number) => {
			const domainValue = domain[index]!;
			onChange(domainValue);
		},
		[domain, onChange],
	);

	return (
		<BaseSlider
			domain={domain}
			value={index}
			onChange={setIndex}
			onCommit={onCommit}
			{...props}
		/>
	);
}
