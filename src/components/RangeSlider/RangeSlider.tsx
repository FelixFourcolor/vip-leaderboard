import { isEqual } from "es-toolkit";
import debounce from "es-toolkit/compat/debounce";
import {
	type Dispatch,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Range } from "react-range";
import { useSyncedState } from "@/hooks/useSyncedState";
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
	const [values, _setValues] = useSyncedState(
		useCallback((): Pair<number> => {
			const fromIndex = domain.indexOf(selectedFrom);
			const toIndex = domain.indexOf(selectedTo);
			return [
				fromIndex !== -1 ? fromIndex : 0,
				toIndex !== -1 ? toIndex : domain.length - 1,
			];
		}, [domain, selectedFrom, selectedTo]),
	);
	const onChangeDebounced = useMemo(() => debounce(onChange, 50), [onChange]);
	const setValues = useCallback(
		(updater: (_: Pair<number>) => Pair<number>) => {
			_setValues((current) => {
				const updated = updater(current);
				if (isEqual(current, updated)) {
					return current;
				}
				const fromValue = domain[updated[0]];
				const toValue = domain[updated[1]];
				if (fromValue !== undefined && toValue !== undefined) {
					onChangeDebounced([fromValue, toValue]);
				}
				return updated;
			});
		},
		[_setValues, domain, onChangeDebounced],
	);

	const [isActive, setIsActive] = useState<Pair<boolean>>([false, false]);
	const [isFocused, setIsFocused] = useState<Pair<boolean>>([false, false]);
	// biome-ignore format: one line
	const dragTimeoutRef = useRef<Pair<number | undefined>>([undefined, undefined]);

	const activateThumb = useCallback((...indices: number[]) => {
		if (indices.length === 0) {
			indices = [0, 1];
		}
		indices.forEach((i) => {
			setIsActive((current) => {
				const updated = [...current] as Pair<boolean>;
				updated[i] = true;
				return updated;
			});
			clearTimeout(dragTimeoutRef.current[i]);
			dragTimeoutRef.current[i] = setTimeout(() => {
				setIsActive((current) => {
					const updated = [...current] as Pair<boolean>;
					updated[i] = false;
					return updated;
				});
			}, 2000);
		});
	}, []);

	const onDrag = (values: number[]) => {
		let [from, to] = values as [number, number];
		setValues(([currentFrom, currentTo]) => {
			activateThumb(from === currentFrom ? 1 : 0);

			const distance = to - from;
			if (distance < minDistance) {
				// If "from" is not moving, adjust it to keep distance with "to".
				// This allows the moving thumb to push the other, instead of being blocked.
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
	};
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

			activateThumb();
			return [from, to];
		});
	};
	const onZoom = (delta: number) => {
		if (!delta) {
			return;
		}
		_setValues(([currentFrom, currentTo]) => {
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

			activateThumb();
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
			onChange={onDrag}
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
					kind={index === 0 ? "from" : "to"}
					onFocus={() => {
						activateThumb(index);
						setIsFocused([index === 0, index === 1]);
					}}
					onBlur={() => setIsFocused([false, false])}
					label={domain[values[index]!]}
					labelRef={[fromLabelRef, toLabelRef][index]}
					showLabel={isActive[index] && (isFocused[index] || !labelsOverlap)}
				/>
			)}
		/>
	);
}

const not = (value: boolean) => !value;
