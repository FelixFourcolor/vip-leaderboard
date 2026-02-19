import { type Dispatch, useCallback, useEffect, useRef, useState } from "react";
import { Direction, Range } from "react-range";
import { useControlled } from "@/hooks/useControlled";
import { Thumb } from "./Thumb";
import { Track } from "./Track";

type RangeProps<Value> = {
	domain: readonly Value[];
	selected: readonly [Value, Value];
	onChange: Dispatch<[Value, Value]>;
	className?: string;
	direction?: "horizontal" | "vertical";
	minDistance?: number;
	maxDistance?: number;
};

export function RangeSlider<Value>({
	domain,
	selected: [selectedFrom, selectedTo],
	onChange,
	minDistance = 1,
	maxDistance = domain.length - 1,
	direction = "horizontal",
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

	const onValueChange = useCallback(
		(values: number[]) => {
			let [from, to] = values as [number, number];
			setValues(([currentFrom, currentTo]) => {
				const distance = to - from;
				if (distance < minDistance) {
					if (from === currentFrom) {
						from = to - minDistance;
					} else {
						to = from + minDistance;
					}
				} else if (distance > maxDistance) {
					if (from === currentFrom) {
						from = to - maxDistance;
					} else {
						to = from + maxDistance;
					}
				}

				if (from < 0 || to >= domain.length) {
					return [currentFrom, currentTo];
				}
				return [from, to];
			});
		},
		[setValues, minDistance, maxDistance, domain.length],
	);

	const onCommit = useCallback(
		(values: number[]) => {
			const [from, to] = values as [number, number];
			console.log("commit", { from, to });
			const fromDomainValue = domain[from!];
			const toDomainValue = domain[to!];
			if (fromDomainValue !== undefined && toDomainValue !== undefined) {
				onChange([fromDomainValue, toDomainValue]);
			}
		},
		[domain, onChange],
	);

	const [labelsOverlap, setLabelsOverlap] = useState(false);
	const fromLabelRef = useRef<HTMLSpanElement>(null);
	const toLabelRef = useRef<HTMLSpanElement>(null);

	const updateLabelOverlap = useCallback(() => {
		const fromLabel = fromLabelRef.current;
		const toLabel = toLabelRef.current;

		if (!fromLabel || !toLabel) {
			setLabelsOverlap(false);
			return;
		}

		const fromRect = fromLabel.getBoundingClientRect();
		const toRect = toLabel.getBoundingClientRect();
		const overlap =
			fromRect.right > toRect.left && fromRect.bottom > toRect.top;
		setLabelsOverlap(overlap);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: values change = thumbs move = re-check for overlap
	useEffect(updateLabelOverlap, [updateLabelOverlap, values]);

	useEffect(() => {
		window.addEventListener("resize", updateLabelOverlap);
		return () => window.removeEventListener("resize", updateLabelOverlap);
	}, [updateLabelOverlap]);

	const max = domain.length - 1;

	return (
		<Range
			direction={direction === "horizontal" ? Direction.Right : Direction.Down}
			values={values}
			onChange={onValueChange}
			onFinalChange={onCommit}
			min={0}
			step={1}
			max={max}
			renderTrack={({ props: trackProps, children, ...rest }) => (
				<Track
					{...trackProps}
					{...rest}
					min={0}
					max={max}
					value={values}
					domain={domain}
					className={className}
					direction={direction}
				>
					{children}
				</Track>
			)}
			renderThumb={({ props: thumbProps, index }) => (
				<Thumb
					{...thumbProps}
					label={domain[values[index]!]}
					labelRef={[fromLabelRef, toLabelRef][index]}
					hideLabel={index === 0 && labelsOverlap}
					kind={index === 0 ? "from" : "to"}
				/>
			)}
		/>
	);
}
