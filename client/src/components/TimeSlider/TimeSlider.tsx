import classNames from "classnames/bind";
import { type ComponentProps, useMemo, useState } from "react";
import { Range } from "react-range";
import { monthsInRange } from "@/utils/time";
import styles from "./TimeSlider.module.css";

const cx = classNames.bind(styles);

type MonthRange = {
	from: string;
	to: string;
};

type Props = {
	domain: MonthRange;
	initial: MonthRange;
	onChange: {
		from: (from: string) => void;
		to: (to: string) => void;
	};
};

export function TimeSlider({ domain, initial, ...props }: Props) {
	const months = useMemo(
		() => monthsInRange(domain.from, domain.to),
		[domain.from, domain.to],
	);

	const [values, setValues] = useState<[number, number]>(
		() => [months.indexOf(initial.from), months.indexOf(initial.to)] as const,
	);

	const onChange = (values: [number, number]) => {
		if (values[1] - values[0] >= 2) {
			setValues(values);
		}
	};

	const onFinalChange = (values: [number, number]) => {
		props.onChange.from(months[values[0]]!);
		props.onChange.to(months[values[1]]!);
	};

	return (
		<div className={cx("container")}>
			<Range
				// screw react-range's bad types!
				values={values as number[]}
				onChange={onChange as (values: number[]) => void}
				onFinalChange={onFinalChange as (values: number[]) => void}
				min={0}
				step={1}
				max={months.length - 1}
				draggableTrack
				renderTrack={({ props, children }) => (
					<Track {...props} min={0} max={months.length - 1} values={values}>
						{children}
						<span className={cx("label", "min")}>{domain.from}</span>
						<span className={cx("label", "max")}>{domain.to}</span>
					</Track>
				)}
				renderThumb={({ props }) => <Thumb {...props} />}
			/>
		</div>
	);
}

interface TrackProps extends ComponentProps<"div"> {
	min: number;
	max: number;
	values: [number, number];
}

const Track = ({
	min,
	max,
	values: [fromValue, toValue],
	className,
	children,
	...props
}: TrackProps) => {
	const total = Math.max(max - min, 1);
	const pre = ((fromValue - min) / total) * 100;
	const selected = ((toValue - fromValue) / total) * 100;

	return (
		<div {...props} className={cx("track", className)}>
			<Thumb className={cx("limit", "from")} />
			<div style={{ width: `${pre}%` }} />
			<div className={cx("selected")} style={{ width: `${selected}%` }} />
			<Thumb className={cx("limit", "to")} />
			{children}
		</div>
	);
};

const Thumb: React.FC<ComponentProps<"div">> = ({ className, ...props }) => (
	<div {...props} className={cx("thumb", className)} />
);
