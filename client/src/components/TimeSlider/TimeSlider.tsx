import classNames from "classnames/bind";
import { type ComponentProps, useMemo, useState } from "react";
import { Range } from "react-range";
import { monthsInRange } from "@/utils/time";
import styles from "./TimeSlider.module.css";

const cx = classNames.bind(styles);

type MonthRange = [from: string, to: string];

type Props = {
	domain: MonthRange;
	initial: MonthRange;
	onChange: [from: (from: string) => void, to: (to: string) => void];
};

export function TimeSlider({
	domain: [domainFrom, domainTo],
	initial: [initialFrom, initialTo],
	onChange: [onChangeFrom, onChangeTo],
}: Props) {
	const months = useMemo(
		() => monthsInRange(domainFrom, domainTo),
		[domainFrom, domainTo],
	);

	const [values, setValues] = useState<[number, number]>(
		() => [months.indexOf(initialFrom), months.indexOf(initialTo)] as const,
	);

	const onChange = (values: [number, number]) => {
		if (values[1] - values[0] >= 1) {
			setValues(values);
		}
	};

	const onFinalChange = ([from, to]: [number, number]) => {
		onChangeFrom(months[from]!);
		onChangeTo(months[to]!);
	};

	return (
		<Range
			// screw react-range's bad types!
			values={values as number[]}
			onChange={onChange as (values: number[]) => void}
			onFinalChange={onFinalChange as (values: number[]) => void}
			min={0}
			step={1}
			max={months.length - 1}
			renderTrack={({ props, children, ...rest }) => (
				<Track
					{...props}
					{...rest}
					min={0}
					max={months.length - 1}
					values={values}
				>
					{children}
					<span className={cx("label", "min")}>{domainFrom}</span>
					<span className={cx("label", "max")}>{domainTo}</span>
				</Track>
			)}
			renderThumb={({ props }) => <Thumb {...props} />}
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

const Thumb: React.FC<ComponentProps<"div">> = ({ className, ...props }) => (
	<div {...props} className={cx("thumb", className)} />
);
