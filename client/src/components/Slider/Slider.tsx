import { type Dispatch, useCallback, useState } from "react";
import { BaseSlider } from "./BaseSlider";

type SliderProps<Value> = {
	domain: readonly Value[];
	value: Value;
	onChange: Dispatch<Value>;
	className?: string;
};

export function Slider<Value>({
	domain,
	value,
	onChange,
	className,
}: SliderProps<Value>) {
	const [index, setIndex] = useState(() => domain.indexOf(value));

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
			className={className}
		/>
	);
}
