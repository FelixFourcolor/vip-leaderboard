import classNames from "classnames/bind";
import { debounce } from "es-toolkit/function";
import {
	type FC,
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import { entries, keys, values } from "@/utils/object";
import type { EitherOr } from "@/utils/types";
import styles from "./DataBarTable.module.css";

const cx = classNames.bind(styles);

export interface DataRow<Col extends string = string> {
	data: Record<Col, number>;
}

type Renderer<Row, H extends "with-header" | "no-header"> = {
	cell?: FC<Row & { "[index]": number }>;
} & (H extends "with-header" ? { header: ReactNode } : { header?: never });

type Columns<
	Col extends string,
	Row,
	H extends "with-header" | "no-header",
> = Record<Col, Renderer<Row, H>> & {
	[K in Exclude<keyof Row, "data"> | "[index]"]?: Renderer<Row, H>;
};

type PrimaryKey<T extends object, K = keyof T> = K extends keyof T
	? T[K] extends PropertyKey
		? K
		: never
	: never;

type Props<
	Row extends DataRow,
	PK extends PrimaryKey<Row>,
	Col extends string = Row extends DataRow<infer U> ? U : never,
> = {
	rows: Row[];
	primaryKey: PK;
	columns: Columns<Col, Row, "with-header"> | Columns<Col, Row, "no-header">;
	activeColumn: Col;
	onSort?: (col: Col) => void;
	title?: ReactNode;
	className?: string;
} & EitherOr<
	// @ts-expect-error: Row[PK] *is* guaranteed to be PropertyKey by the PrimaryKey constraint,
	// but TS doesn't know that
	{ rowColors: Record<Row[PK], string> },
	{ columnColors: Record<Col, string> }
>;

export function DataBarTable<Row extends DataRow, PK extends PrimaryKey<Row>>({
	rows,
	columns,
	title,
	activeColumn,
	onSort,
	columnColors,
	rowColors,
	primaryKey,
	className,
}: Props<Row, PK>) {
	type Col = Row extends DataRow<infer U> ? U : never;

	const isSorted = onSort !== undefined;
	const sortBy = isSorted ? activeColumn : undefined;

	const scales = useMemo(() => {
		if (rows.length === 0) {
			return [];
		}
		const max = isSorted
			? rows[0]!.data[activeColumn]!
			: Math.max(...rows.map((r) => r.data[activeColumn]!));

		return rows.map((r) => r.data[activeColumn]! / max);
	}, [rows, activeColumn, isSorted]);

	const tableRef = useRef<HTMLTableElement>(null);
	const containerRef = useRef<HTMLElement | Window>(null);
	useEffect(() => {
		const table = tableRef.current;
		if (!table) {
			return;
		}

		const getScrollParent = (node: HTMLElement | null) => {
			if (!node) {
				return window;
			}
			const { overflowY } = window.getComputedStyle(node);
			if (overflowY === "scroll" || overflowY === "auto") {
				return node;
			}
			return getScrollParent(node.parentElement);
		};

		containerRef.current = getScrollParent(table);
	}, []);

	// to stay on the same index when data change
	const topVisibleRowRef = useRef<{ index: number; offset: number }>(null);
	useEffect(() => {
		const table = tableRef.current;
		const scrollParent = containerRef.current;
		if (!table || !scrollParent) {
			return;
		}

		const handleScroll = debounce(() => {
			const containerTop =
				scrollParent instanceof HTMLElement
					? scrollParent.getBoundingClientRect().top
					: 0;

			const tableRows = table.tBodies[0]!.rows;
			const topVisibleRowIdx = (() => {
				for (let i = 0; i < tableRows.length; i++) {
					const row = tableRows[i];
					if (
						row?.hasAttribute("data-row") &&
						row.getBoundingClientRect().bottom > containerTop
					) {
						return i;
					}
				}
				return -1;
			})();
			const topVisibleRow = tableRows[topVisibleRowIdx];

			if (topVisibleRow) {
				const offset = topVisibleRow.getBoundingClientRect().top - containerTop;
				topVisibleRowRef.current = { index: topVisibleRowIdx, offset };
			}
		}, 100);

		scrollParent.addEventListener("scroll", handleScroll, { passive: true });
		return () => scrollParent.removeEventListener("scroll", handleScroll);
	}, []);
	useLayoutEffect(() => {
		const table = tableRef.current;
		const scrollParent = containerRef.current;
		const topVisibleRow = topVisibleRowRef.current;
		if (!table || !scrollParent || !sortBy || !topVisibleRow || !rows.length) {
			return;
		}

		const { index, offset } = topVisibleRow;
		const tableRows = table.tBodies[0]!.rows;
		const targetIndex = Math.min(index, tableRows.length - 1);
		const targetRow = tableRows[targetIndex];

		if (targetRow) {
			const containerTop =
				scrollParent instanceof HTMLElement
					? scrollParent.getBoundingClientRect().top
					: 0;

			const currentTop = targetRow.getBoundingClientRect().top;
			const scrollAmount = currentTop - (containerTop + offset);

			if (scrollParent instanceof HTMLElement) {
				scrollParent.scrollTop += scrollAmount;
			} else {
				window.scrollBy(0, scrollAmount);
			}
		}
	}, [rows, sortBy]);

	if (rows.length === 0) {
		return;
	}

	const dataColumns = keys(rows[0]!.data) as Col[];
	const isDataColumn = (col: any): col is Col => dataColumns.includes(col);

	return (
		<table className={cx("data-bar-table", className)} ref={tableRef}>
			<tbody>
				{title && (
					<tr>
						<th colSpan={values(columns).length}>{title}</th>
					</tr>
				)}
				{values(columns).some((c) => c.header) && (
					<tr>
						{entries(columns).map(([col, { header }]) =>
							sortBy && isDataColumn(col) ? (
								<th
									key={col}
									className={cx("sortable", { sorted: sortBy === col })}
									aria-sort={sortBy === col ? "descending" : undefined}
									onClick={() => onSort?.(col)}
									tabIndex={sortBy === col ? -1 : 0}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											onSort?.(col);
											e.preventDefault();
										}
									}}
								>
									{header}
									<SortIcon />
								</th>
							) : (
								<th key={col.toString()}>{header}</th>
							),
						)}
					</tr>
				)}
				{rows.map((row, i) => (
					<tr key={String(row[primaryKey])} data-row>
						{entries(columns).map(([col, { cell: CellRenderer }]) =>
							isDataColumn(col) ? (
								<td
									key={col}
									className={cx("data", { scaled: activeColumn === col })}
									style={{
										["--bar-scale" as string]: scales[i],
										["--bar-color" as string]:
											columnColors?.[col] ?? rowColors?.[row[primaryKey]],
									}}
								>
									{CellRenderer ? (
										<CellRenderer {...{ ...row, "[index]": i }} />
									) : (
										row.data[col]
									)}
								</td>
							) : (
								<td key={col.toString()}>
									{CellRenderer ? (
										<CellRenderer {...{ ...row, "[index]": i }} />
									) : col === "[index]" ? (
										i + 1
									) : (
										String(row[col])
									)}
								</td>
							),
						)}
					</tr>
				))}
			</tbody>
		</table>
	);
}

const SortIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="currentColor"
	>
		<path d="M6 8l6 8 6-8z" />
	</svg>
);
