import classNames from "classnames/bind";
import { type FC, type KeyboardEvent, type ReactNode, useMemo } from "react";
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
	const scales = useMemo(() => {
		if (rows.length === 0) {
			return [];
		}
		const max = isSorted
			? rows[0]!.data[activeColumn]!
			: Math.max(...rows.map((r) => r.data[activeColumn]!));

		return rows.map((r) => r.data[activeColumn]! / max);
	}, [rows, activeColumn, isSorted]);

	if (rows.length === 0) {
		return;
	}

	const dataColumns = keys(rows[0]!.data);
	const isDataColumn = (col: any): col is Col => dataColumns.includes(col);

	const headerSortProps = (col: Col) => ({
		className: cx("sortable", { sorted: activeColumn === col }),
		"aria-sort": activeColumn === col ? ("descending" as const) : undefined,
		onClick: () => onSort?.(col),
		tabIndex: activeColumn === col ? -1 : 0,
		onKeyDown: (e: KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				onSort?.(col);
				e.preventDefault();
			}
		},
	});
	const dataRowProps = (col: Col, index: number) => ({
		className: cx("data", { scaled: activeColumn === col }),
		style: {
			["--bar-scale" as string]: scales[index],
			["--bar-color" as string]:
				columnColors?.[col] ?? rowColors?.[rows[index]![primaryKey]],
		},
	});

	return (
		<table className={cx("data-bar-table", className)}>
			<tbody>
				{title && (
					<tr>
						<th colSpan={values(columns).length}>{title}</th>
					</tr>
				)}
				{values(columns).some((c) => c.header) && (
					<tr>
						{entries(columns).map(([col, { header }]) =>
							isDataColumn(col) && isSorted ? (
								<th key={col} {...headerSortProps(col)}>
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
					<tr key={String(row[primaryKey])}>
						{entries(columns).map(([col, { cell: CellRenderer }]) =>
							isDataColumn(col) ? (
								<td key={col} {...dataRowProps(col, i)}>
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

function SortIcon() {
	return (
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
}
