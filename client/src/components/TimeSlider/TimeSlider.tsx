import { noop } from "es-toolkit";
import { useMemo, useState } from "react";
import { Range } from "react-range";

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

export function TimeSlider({ domain, initial, onChange }: Props) {
	const months = useMemo(
		() => monthsInRange(domain.from, domain.to),
		[domain.from, domain.to],
	);

	const [values, setValues] = useState(() => [
		months.indexOf(initial.from),
		months.indexOf(initial.to),
	]);

	const onFinalChange = ([fromValue, toValue]: number[]) => {
		onChange.from(months[fromValue!]!);
		onChange.to(months[toValue!]!);
	};

	return (
		<Range
			values={values}
			min={0}
			step={1}
			max={months.length - 1}
			onChange={setValues}
			onFinalChange={onFinalChange}
			draggableTrack
			renderTrack={({ props, children }) => (
				<div
					{...props}
					style={{
						...props.style,
						height: "6px",
						width: "100%",
						backgroundColor: "var(--text-tertiary)",
					}}
				>
					{children}
				</div>
			)}
			renderThumb={({ props }) => (
				<div
					{...props}
					key={props.key}
					style={{
						...props.style,
						height: "32px",
						width: "8px",
						backgroundColor: "var(--accent)",
					}}
				/>
			)}
		/>
	);
}

function monthsInRange(from: string, to: string): string[] {
	const fromDate = new Date(from);
	const fromYear = fromDate.getUTCFullYear();
	const fromMonth = fromDate.getUTCMonth();

	const toDate = new Date(to);
	const toYear = toDate.getUTCFullYear();
	const toMonth = toDate.getUTCMonth();

	return Array.from(
		{ length: (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1 },
		(_, i) => {
			const date = new Date(Date.UTC(fromYear, fromMonth + i, 1));
			return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
		},
	);
}
