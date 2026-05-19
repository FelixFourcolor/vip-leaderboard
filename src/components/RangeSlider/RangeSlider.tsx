import { type Dispatch, useCallback, useEffect, useRef, useState } from "react";
import { Range } from "react-range";
import { useControlled } from "@/hooks/useControlled";
import type { Pair } from "@/utils/types";
import { Thumb } from "./Thumb";
import { Track } from "./Track";

type SliderProps<Value> = {
	domain: readonly Value[];
	selected: Pair<Value>;
	onChange: Dispatch<Pair<Value>>;
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
	const [values, _setValues] = useControlled(
		useCallback((): Pair<number> => {
			const fromIndex = domain.indexOf(selectedFrom);
			const toIndex = domain.indexOf(selectedTo);
			return [
				fromIndex !== -1 ? fromIndex : 0,
				toIndex !== -1 ? toIndex : domain.length - 1,
			];
		}, [domain, selectedFrom, selectedTo]),
	);

	// dragging = actually dragging
	// active = either dragging or recently dragged
	const [isDragging, setIsDragging] = useState<Pair<boolean>>([false, false]);
	const [isActive, setIsActive] = useState<Pair<boolean>>([false, false]);
	// biome-ignore format: one line
	const dragTimeoutRef = useRef<Pair<number | undefined>>([undefined, undefined]);

	const activateThumb = useCallback((index: number) => {
		setIsActive((current) => {
			const updated = [...current] as Pair<boolean>;
			updated[index] = true;
			return updated;
		});
		clearTimeout(dragTimeoutRef.current[index]);
		dragTimeoutRef.current[index] = setTimeout(() => {
			setIsActive((current) => {
				const updated = [...current] as Pair<boolean>;
				updated[index] = false;
				return updated;
			});
		}, 2000);
	}, []);

	const setValues = useCallback(
		(updater: (_: Pair<number>) => Pair<number>) => {
			_setValues((current) => {
				const updated = updater(current);

				if (updated[0] !== current[0] && updated[1] !== current[1]) {
					setIsDragging([true, true]);
				} else if (updated[0] !== current[0]) {
					setIsDragging([true, false]);
				} else if (updated[1] !== current[1]) {
					setIsDragging([false, true]);
				} else {
					setIsDragging([false, false]);
				}
				updated.forEach((value, i) => {
					if (value !== current[i]) {
						activateThumb(i);
					}
				});

				return updated;
			});
		},
		[activateThumb, _setValues],
	);

	const onValueChange = useCallback(
		(values: number[]) => {
			let [from, to] = values as [number, number];
			setValues(([currentFrom, currentTo]) => {
				const distance = to - from;
				if (distance < minDistance) {
					if (from === currentFrom) {
						to = from + minDistance;
					} else {
						from = to - minDistance;
					}
				} else if (distance > maxDistance) {
					if (from === currentFrom) {
						to = from + maxDistance;
					} else {
						from = to - maxDistance;
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

		if (!fromLabel || !toLabel || isActive.some(not)) {
			setLabelsOverlap(false);
			return;
		}

		const fromRect = fromLabel.getBoundingClientRect();
		const toRect = toLabel.getBoundingClientRect();
		const overlap = fromRect.right > toRect.left;
		setLabelsOverlap(overlap);
	}, [isActive]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: values change = thumbs move = re-check for overlap
	useEffect(updateLabelOverlap, [updateLabelOverlap, values]);

	useEffect(() => {
		addEventListener("resize", updateLabelOverlap);
		return () => removeEventListener("resize", updateLabelOverlap);
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
					onWheel={({ deltaX, deltaY }) => {
						if (Math.abs(deltaX) > Math.abs(deltaY)) {
							onShift(Math.sign(deltaX));
						} else {
							onZoom(Math.sign(deltaY));
						}
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
					onFocus={() => activateThumb(index)}
					label={domain[values[index]!]}
					labelRef={[fromLabelRef, toLabelRef][index]}
					hideLabel={!isActive[index] || (labelsOverlap && !isDragging[index])}
					kind={index === 0 ? "from" : "to"}
				/>
			)}
		/>
	);
}

const not = (value: boolean) => !value;
