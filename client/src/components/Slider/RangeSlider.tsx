import { type Dispatch, useCallback } from "react";
import { useControlled } from "@/hooks/useControlled";
import { BaseSlider } from "./BaseSlider";

type RangeProps<Value> = {
	domain: readonly Value[];
	selected: readonly [Value, Value];
	onChange: readonly [Dispatch<Value>, Dispatch<Value>];
	className?: string;
};

export function RangeSlider<Value>({
	domain,
	selected: [selectedFrom, selectedTo],
	onChange: [onChangeFrom, onChangeTo],
	className,
}: RangeProps<Value>) {
	const [values, setValues] = useControlled(
		useCallback((): [number, number] => {
			const fromIndex = domain.indexOf(selectedFrom);
			const toIndex = domain.indexOf(selectedTo);
			return [
				fromIndex !== -1 ? fromIndex : 0,
				toIndex !== -1 ? toIndex : domain.length - 1,
			];
		}, [domain, selectedFrom, selectedTo]),
	);

	const onChange = useCallback(
		([from, to]: [number, number]) => {
			if (to - from >= 1) {
				setValues([from, to]);
			}
		},
		[setValues],
	);

	const onCommit = useCallback(
		([from, to]: [number, number]) => {
			const fromDomainValue = domain[from!]!;
			const toDomainValue = domain[to!]!;
			onChangeFrom(fromDomainValue);
			onChangeTo(toDomainValue);
		},
		[domain, onChangeFrom, onChangeTo],
	);

	return (
		<BaseSlider
			domain={domain}
			value={values}
			onChange={onChange}
			onCommit={onCommit}
			className={className}
		/>
	);
}
