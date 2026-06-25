import className from "classnames/bind";
import {
	type ComponentProps,
	createContext,
	type ReactNode,
	use,
	useId,
	useRef,
	useState,
} from "react";
import type { Maybe } from "@/utils/types";
import styles from "./SearchBar.module.css";

const cx = className.bind(styles);

type Props = {
	onChange: (input: string) => void;
	placeholder?: string;
	suggestions?: readonly string[];
	className?: string;
	children?: ReactNode;
};

export function SearchBar({
	onChange,
	placeholder,
	suggestions,
	className,
	children: label,
}: Props) {
	const inputId = useId();
	const datalistId = useId();

	const [value, _setValue] = useState("");
	const setValue = (value: string) => {
		_setValue(value);
		onChange(value);
	};

	const inputRef = useRef<HTMLInputElement>(null);

	const main = (
		<div className={cx("container", className)}>
			<input
				onChange={({ target: { value } }) => setValue(value)}
				id={inputId}
				list={datalistId}
				placeholder={placeholder}
				value={value}
				ref={inputRef}
			/>
			{suggestions && (
				<datalist id={datalistId}>
					{suggestions.map((value) => (
						<option key={value} value={value} />
					))}
				</datalist>
			)}
			{value && (
				<ClearIcon
					onClick={() => {
						setValue("");
						inputRef?.current?.focus();
					}}
				/>
			)}
		</div>
	);

	if (!label) {
		return main;
	}
	return (
		<InputIdContext value={inputId}>
			{label}
			{main}
		</InputIdContext>
	);
}

const InputIdContext = createContext<Maybe<string>>(undefined);

export const Label = (props: Omit<ComponentProps<"label">, "htmlFor">) => (
	<label {...props} htmlFor={use(InputIdContext)} />
);

const ClearIcon = ({ onClick }: { onClick: () => void }) => (
	<button className={cx("clear-icon")} onClick={onClick}>
		<svg width="12" height="12" viewBox="0 0 12 12">
			<path d="M1 1l10 10M11 1L1 11" stroke="currentColor" />
		</svg>
	</button>
);
