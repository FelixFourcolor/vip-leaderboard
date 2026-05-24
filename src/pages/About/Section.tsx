import classNames from "classnames/bind";
import {
	createContext,
	type ReactNode,
	use,
	useCallback,
	useState,
} from "react";
import { Button } from "@/components/Button";
import type { State } from "@/utils/types";
import styles from "./AboutPage.module.css";

const cx = classNames.bind(styles);

type Props = {
	title: ReactNode;
	children: ReactNode;
};

export function Section({ title, children }: Props) {
	const [expandState, setExpandState] = useState<ExpandState>({});

	const hasSubsections = Object.keys(expandState).length > 0;
	const isExpanded = !Object.values(expandState).some((x) => !x);

	return (
		<section>
			<div className={cx("header")}>
				<h1>{title}</h1>
				{hasSubsections && (
					<Button
						onClick={() =>
							setExpandState((x) =>
								Object.fromEntries(Object.keys(x).map((k) => [k, !isExpanded])),
							)
						}
					>
						{isExpanded ? "Collapse all" : "Expand all"}
					</Button>
				)}
			</div>
			<ExpandStateContext value={{ expandState, setExpandState }}>
				{children}
			</ExpandStateContext>
		</section>
	);
}

export function Subsection({ title, children }: Props) {
	const [id] = useState(() => crypto.randomUUID());
	const [isExpanded, setIsExpanded] = useExpandState(id);

	const ref = () => {
		// to register that this subsection exists
		if (isExpanded === undefined) {
			setIsExpanded(false);
		}
	};

	return (
		<details
			open={isExpanded}
			ref={ref}
			onToggle={(e) => setIsExpanded(e.currentTarget.open)}
			className={cx("subsection")}
		>
			<summary className={cx("subheader")}>{title}</summary>
			{children}
		</details>
	);
}

type ExpandState = Record<string, boolean>;
type ContextValue = State<"expandState", ExpandState, { action: true }>;

const ExpandStateContext = createContext<ContextValue | null>(null);

function useExpandState(subsectionId: string) {
	const context = use(ExpandStateContext);
	if (!context) {
		throw new Error("useExpandState must be used within a Section");
	}
	const { expandState, setExpandState } = context;

	const isExpanded = expandState[subsectionId];
	const setIsExpanded = useCallback(
		(value: boolean) =>
			setExpandState((x) => ({ ...x, [subsectionId]: value })),
		[setExpandState, subsectionId],
	);

	return [isExpanded, setIsExpanded] as const;
}
