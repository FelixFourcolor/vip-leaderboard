import classNames from "classnames/bind";
import {
	type ComponentProps,
	type Ref,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Range } from "react-range";
import { useControlled } from "@/hooks/useControlled";
import { monthsInRange } from "@/utils/time";
import styles from "./TimeSlider.module.css";

const cx = classNames.bind(styles);

type MonthRange = [from: string, to: string];

type Props = {
	domain: MonthRange;
	selected: MonthRange;
	onChange: [from: (from: string) => void, to: (to: string) => void];
	className?: string;
};

export function TimeSlider({
	domain: [domainFrom, domainTo],
	selected: [selectedFrom, selectedTo],
	onChange: [onChangeFrom, onChangeTo],
	className,
}: Props) {
	const months = useMemo(
		() => monthsInRange(domainFrom, domainTo),
		[domainFrom, domainTo],
	);

	const [values, setValues] = useControlled(
		useCallback((): [number, number] => {
			const fromIndex = months.indexOf(selectedFrom);
			const toIndex = months.indexOf(selectedTo);

			return [
				fromIndex !== -1 ? fromIndex : 0,
				toIndex !== -1 ? toIndex : months.length - 1,
			];
		}, [selectedFrom, selectedTo, months]),
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
		const overlap = fromRect.right > toRect.left;
		setLabelsOverlap(overlap);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: values change = thumbs move = re-check for overlap
	useEffect(updateLabelOverlap, [updateLabelOverlap, values]);

	useEffect(() => {
		window.addEventListener("resize", updateLabelOverlap);
		return () => window.removeEventListener("resize", updateLabelOverlap);
	}, [updateLabelOverlap]);

	const onChange = (values: [number, number]) => {
		if (values[1] - values[0] >= 1) {
			setValues(values);
		}
	};

	const onFinalChange = ([from, to]: [number, number]) => {
		onChangeFrom(months[from]!);
		onChangeTo(months[to]!);
	};

	const max = months.length - 1;

	return (
		<Range
			// screw react-range's bad types!
			values={values as number[]}
			onChange={onChange as (values: number[]) => void}
			onFinalChange={onFinalChange as (values: number[]) => void}
			min={0}
			step={1}
			max={max}
			renderTrack={({ props, children, ...rest }) => (
				<Track
					{...props}
					{...rest}
					className={className}
					min={0}
					max={max}
					values={values}
				>
					{children}
					<span className={cx("label", "min")}>{domainFrom}</span>
					<span className={cx("label", "max")}>{domainTo}</span>
				</Track>
			)}
			renderThumb={({ props, index }) => (
				<Thumb
					{...props}
					label={months[values[index]!]}
					labelRef={[fromLabelRef, toLabelRef][index]}
					hideLabel={index === 0 && labelsOverlap}
				/>
			)}
		/>
	);
}

interface TrackProps extends ComponentProps<"div"> {
	isDragged: boolean;
	min: number;
	max: number;
	values: [number, number];
}

const Track = ({
	min,
	max,
	values: [fromValue, toValue],
	isDragged,
	className,
	children,
	...props
}: TrackProps) => {
	const total = Math.max(max - min, 1);
	const pre = ((fromValue - min) / total) * 100;
	const selected = ((toValue - fromValue) / total) * 100;

	return (
		<div {...props} className={cx("track", isDragged && "dragged", className)}>
			<Thumb className={cx("limit", "from")} />
			<div className={cx("bar")}>
				<div style={{ width: `${pre}%` }} />
				<div className={cx("selected")} style={{ width: `${selected}%` }} />
			</div>
			<Thumb className={cx("limit", "to")} />
			{children}
		</div>
	);
};

type ThumbProps = ComponentProps<"div"> & {
	label?: string;
	hideLabel?: boolean;
	labelRef?: Ref<HTMLSpanElement>;
};

const Thumb: React.FC<ThumbProps> = ({
	className,
	label,
	hideLabel,
	labelRef,
	...props
}) => (
	<div {...props} className={cx("thumb", className)}>
		{label && (
			<span ref={labelRef} className={cx("label", hideLabel && "hidden")}>
				{label}
			</span>
		)}
	</div>
);
