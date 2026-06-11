import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import {
	createContext,
	type ReactNode,
	use,
	useCallback,
	useMemo,
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

	const isMajorityExpanded = useMemo(() => {
		const values = Object.values(expandState);
		if (values.length > 0) {
			return values.filter(Boolean).length > values.length / 2;
		}
	}, [expandState]);

	return (
		<section>
			<div className={cx("header")}>
				<h1>{title}</h1>
				{isMajorityExpanded !== undefined && (
					<Button
						onClick={() =>
							setExpandState((x) => mapValues(x, () => !isMajorityExpanded))
						}
					>
						{isMajorityExpanded ? "Collapse all" : "Expand all"}
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
type ContextValue = State<{ expandState: ExpandState }>;
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
