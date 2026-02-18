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
import { useCursorDragged } from "@/hooks/useCursorDragged";
import styles from "./Slider.module.css";

const cx = classNames.bind(styles);

type BaseProps = {
	domain: readonly unknown[];
	className?: string;
} & (
	| {
			value: number;
			onChange: (value: number) => void;
			onCommit: (value: number) => void;
	  }
	| {
			value: [number, number];
			onChange: (value: [number, number]) => void;
			onCommit: (value: [number, number]) => void;
	  }
);

export function BaseSlider({
	domain,
	className,
	value: valueProp,
	onChange: onChangeProp,
	onCommit: onCommitProp,
}: BaseProps) {
	const max = domain.length - 1;

	const { values, onChange, onCommit } = useMemo(() => {
		if (typeof valueProp === "number") {
			return {
				values: [valueProp],
				onChange: ([value]: number[]) => onChangeProp(value as any),
				onCommit: ([value]: number[]) => onCommitProp(value as any),
			};
		}
		return {
			values: valueProp,
			onChange: (values: number[]) => onChangeProp(values as any),
			onCommit: (values: number[]) => onCommitProp(values as any),
		};
	}, [valueProp, onChangeProp, onCommitProp]);

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

	return (
		<Range
			values={values}
			onChange={onChange}
			onFinalChange={onCommit}
			min={0}
			step={1}
			max={max}
			renderTrack={({ props, children, ...rest }) => (
				<Track
					{...props}
					{...rest}
					min={0}
					max={max}
					value={valueProp}
					domain={domain}
					className={className}
				>
					{children}
				</Track>
			)}
			renderThumb={({ props, index }) => (
				<Thumb
					{...props}
					label={domain[values[index]!]}
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
	domain: readonly unknown[];
	value: number | readonly [number, number];
}

const Track = ({
	min,
	max,
	domain,
	value,
	isDragged,
	className,
	children,
	...props
}: TrackProps) => {
	useCursorDragged(isDragged);

	const [from, to] = typeof value === "number" ? [0, value] : value;
	const total = Math.max(max - min, 1);
	const pre = ((from - min) / total) * 100;
	const selected = ((to - from) / total) * 100;

	return (
		<div {...props} className={cx("track", isDragged && "dragged", className)}>
			<Thumb className={cx("limit", "from")} />
			<div className={cx("bar")}>
				<div style={{ width: `${pre}%` }} />
				<div className={cx("selected")} style={{ width: `${selected}%` }} />
			</div>
			<Thumb className={cx("limit", "to")} />
			{children}
			<span className={cx("label", "min")}>{String(domain[min])}</span>
			<span className={cx("label", "max")}>{String(domain[max])}</span>
		</div>
	);
};

type ThumbProps = ComponentProps<"div"> & {
	label?: unknown;
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
		{label != null && (
			<span ref={labelRef} className={cx("label", hideLabel && "hidden")}>
				{String(label)}
			</span>
		)}
	</div>
);
