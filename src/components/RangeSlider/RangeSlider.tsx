import { isEqual } from "es-toolkit";
import debounceFn from "es-toolkit/compat/debounce";
import { type Dispatch, useCallback, useMemo, useRef, useState } from "react";
import { Range } from "react-range";
import { useSyncedState } from "@/hooks/useSyncedState";
import type { Pair } from "@/utils/types";
import { ThumbWrapper } from "./Thumb";
import { Track } from "./Track";

type RangeSliderProps<Value> = {
	domain: readonly Value[];
	selected: Pair<Value>;
	onChange: Dispatch<Pair<Value>>;
	debounce?: number;
	className?: string;
	minDistance?: number;
	maxDistance?: number;
	autoHideLabel?: boolean;
};

export function RangeSlider<Value>({
	domain,
	selected: [selectedFrom, selectedTo],
	onChange,
	debounce,
	minDistance = 1,
	maxDistance = domain.length - 1,
	className,
	autoHideLabel = false,
}: RangeSliderProps<Value>) {
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

	const onChangeDebounced = useMemo(
		() => (debounce ? debounceFn(onChange, debounce) : onChange),
		[onChange, debounce],
	);

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
			if (from === currentFrom && to === currentTo) {
				return [currentFrom, currentTo];
			}

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

	const rangeRef = useRef<Range>(null);
	const max = domain.length - 1;

	return (
		<Range
			ref={rangeRef}
			values={values}
			allowOverlap
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
			renderThumb={({ props, index }) => (
				<ThumbWrapper
					{...props}
					key={index}
					rangeRef={rangeRef}
					values={values}
					index={index}
					domain={domain}
					isActive={isActive}
					isFocused={isFocused}
					autoHideLabel={autoHideLabel}
					setIsFocused={(focused) => {
						if (focused) {
							activateThumb(index);
							setIsFocused([index === 0, index === 1]);
						} else {
							setIsFocused([false, false]);
						}
					}}
				/>
			)}
		/>
	);
}
