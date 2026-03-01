import { type Dispatch, useCallback, useEffect, useRef, useState } from "react";
import { Range } from "react-range";
import { useControlled } from "@/hooks/useControlled";
import { Thumb } from "./Thumb";
import { Track } from "./Track";

type SliderProps<Value> = {
	domain: readonly Value[];
	selected: readonly [Value, Value];
	onChange: Dispatch<[Value, Value]>;
	className?: string;
	minDistance?: number;
	maxDistance?: number;
};

export function RangeSlider<Value>({
	domain,
	selected: [selectedFrom, selectedTo],
	onChange,
	minDistance = 1,
	maxDistance = domain.length - 1,
	className,
}: SliderProps<Value>) {
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

	useEffect(() => {
		const fromValue = domain[values[0]!];
		const toValue = domain[values[1]!];
		if (fromValue !== undefined && toValue !== undefined) {
			onChange([fromValue, toValue]);
		}
	}, [values, onChange, domain]);

	const onShift = (delta: number) => {
		if (!delta) {
			return;
		}
		setValues(([currentFrom, currentTo]) => {
			const currentDistance = currentTo - currentFrom;
			let from = currentFrom + delta;
			let to = currentTo + delta;
			if (from < 0) {
				from = 0;
				to = currentDistance;
			} else if (to >= domain.length) {
				to = domain.length - 1;
				from = to - currentDistance;
			}
			return [from, to];
		});
	};

	const onZoom = (delta: number) => {
		if (!delta) {
			return;
		}
		setValues(([currentFrom, currentTo]) => {
			let from = currentFrom - delta;
			let to = currentTo + delta;
			if (from < 0) {
				from = 0;
			}
			if (to >= domain.length) {
				to = domain.length - 1;
			}

			const distance = to - from;
			if (distance < minDistance) {
				const adjustment = minDistance - distance;
				from -= Math.floor(adjustment / 2);
				to += Math.ceil(adjustment / 2);
			} else if (distance > maxDistance) {
				const adjustment = distance - maxDistance;
				from += Math.floor(adjustment / 2);
				to -= Math.ceil(adjustment / 2);
			}

			return [from, to];
		});
	};

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
		const overlap = fromRect.right > toRect.left;
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
			values={values}
			onChange={onValueChange}
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
					onWheel={(e) => {
						onShift(Math.sign(e.deltaX));
						onZoom(Math.sign(e.deltaY));
					}}
					domain={domain}
					className={className}
				>
					{children}
				</Track>
			)}
			renderThumb={({ props: thumbProps, index }) => (
				<Thumb
					{...thumbProps}
					key={index}
					label={domain[values[index]!]}
					labelRef={[fromLabelRef, toLabelRef][index]}
					hideLabel={index === 0 && labelsOverlap}
					kind={index === 0 ? "from" : "to"}
				/>
			)}
		/>
	);
}
