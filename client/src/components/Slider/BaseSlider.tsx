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
import { Direction, Range } from "react-range";
import { useCursorDragged } from "@/hooks/useCursorDragged";
import styles from "./Slider.module.css";

const cx = classNames.bind(styles);

type BaseProps = {
	domain: readonly unknown[];
	className?: string;
	direction?: "horizontal" | "vertical";
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
	direction = "horizontal",
	value,
	onChange: onChangeProp,
	onCommit: onCommitProp,
}: BaseProps) {
	const max = domain.length - 1;

	const { values, onChange, onCommit } = useMemo(() => {
		if (typeof value === "number") {
			return {
				values: [value],
				onChange: ([value]: number[]) => onChangeProp(value as any),
				onCommit: ([value]: number[]) => onCommitProp(value as any),
			};
		}
		return {
			values: value,
			onChange: (values: number[]) => onChangeProp(values as any),
			onCommit: (values: number[]) => onCommitProp(values as any),
		};
	}, [value, onChangeProp, onCommitProp]);

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
			direction={direction === "horizontal" ? Direction.Right : Direction.Down}
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
					value={value}
					domain={domain}
					className={className}
					direction={direction}
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
					kind={typeof value === "object" && index === 0 ? "from" : "to"}
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
	direction: "horizontal" | "vertical";
}

const Track = ({
	min,
	max,
	domain,
	value,
	isDragged,
	direction,
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
		<div
			{...props}
			className={cx("track", isDragged && "dragged", className, direction)}
		>
			{typeof value === "object" && (
				<>
					<Thumb className={cx("limit")} kind="from" />
					<span className={cx("label", "min")}>{String(domain[min])}</span>
				</>
			)}

			{children}
			<div
				className={cx("bar")}
				style={{
					["--pre" as string]: `${pre}%`,
					["--selected" as string]: `${selected}%`,
				}}
			>
				<div className={cx("pre")} />
				<div className={cx("selected")} />
			</div>
			<Thumb className={cx("limit")} kind="to" />
			<span className={cx("label", "max")}>{String(domain[max])}</span>
		</div>
	);
};

type ThumbProps = ComponentProps<"div"> & {
	label?: unknown;
	hideLabel?: boolean;
	labelRef?: Ref<HTMLSpanElement>;
	kind: "from" | "to";
};

const Thumb: React.FC<ThumbProps> = ({
	label,
	hideLabel,
	labelRef,
	kind,
	className,
	...props
}) => (
	<div {...props} className={cx("thumb", kind, className)}>
		{label != null && (
			<span ref={labelRef} className={cx("label", hideLabel && "hidden")}>
				{String(label)}
			</span>
		)}
	</div>
);
