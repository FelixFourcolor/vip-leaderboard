import classNames from "classnames/bind";
import { type FC, type KeyboardEvent, type ReactNode, useMemo } from "react";
import { entries, keys, values } from "@/utils/object";
import type { EitherOr, State } from "@/utils/types";
import styles from "./DataBarTable.module.css";

const cx = classNames.bind(styles);

export interface DataRow<Col extends string = string> {
	data: Record<Col, number>;
}

type Renderer<Row, H extends "with-header" | "no-header"> = {
	header?: H extends "with-header" ? ReactNode : never;
	cell?: FC<Row & { "[index]": number }>;
};

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
	className?: string;
} & EitherOr<
	{ columnColors: Record<Col, string> },
	// @ts-expect-error: Row[PK] *is* guaranteed to be PropertyKey by the PrimaryKey constraint,
	// but TS doesn't know that
	{ rowColors: Record<Row[PK], string> }
> &
	EitherOr<
		{ columns: Columns<Col, Row, "with-header"> },
		{ title: ReactNode; columns: Columns<Col, Row, "no-header"> }
	> &
	EitherOr<
		{ scaleBy: Col },
		{
			compare: (a: Row, b: Row, by: Col) => number;
		} & State<"sortBy", Col, { action: false }>
	>;

export function DataBarTable<Row extends DataRow, PK extends PrimaryKey<Row>>({
	rows,
	columns,
	title,
	columnColors,
	rowColors,
	primaryKey,
	sortBy,
	scaleBy = sortBy,
	compare,
	setSortBy,
	className,
}: Props<Row, PK>) {
	type Col = Row extends DataRow<infer U> ? U : never;

	const sortedRows = useMemo(
		() =>
			!compare || !sortBy
				? rows
				: rows.toSorted((a, b) => compare(a, b, sortBy)),
		[rows, sortBy, compare],
	);

	const scales = useMemo(() => {
		if (sortedRows.length === 0) {
			return [];
		}
		if (!scaleBy) {
			throw new Error("either scaleBy or sortBy must be provided");
		}
		const max = Math.max(...sortedRows.map((r) => r.data[scaleBy]!));
		return sortedRows.map((r) => r.data[scaleBy]! / max);
	}, [sortedRows, scaleBy]);

	if (sortedRows.length === 0) {
		return;
	}

	const dataColumns = keys(sortedRows[0]!.data);
	const isDataColumn = (col: any): col is Col => dataColumns.includes(col);

	const headerSortProps = (col: Col) => ({
		className: cx("sortable", { sorted: sortBy === col }),
		"aria-sort": sortBy === col ? ("descending" as const) : undefined,
		onClick: () => setSortBy?.(col),
		tabIndex: sortBy === col ? -1 : 0,
		onKeyDown: (e: KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				setSortBy?.(col);
				e.preventDefault();
			}
		},
	});
	const dataRowProps = (col: Col, index: number) => ({
		className: cx("data", { scaled: scaleBy === col }),
		style: {
			["--bar-scale" as string]: scales[index],
			["--bar-color" as string]:
				columnColors?.[col] ?? rowColors?.[sortedRows[index]![primaryKey]],
		},
	});

	return (
		<table className={cx("data-bar-table", className)}>
			<tbody>
				<tr>
					{title ? (
						<th colSpan={values(columns).length}>{title}</th>
					) : (
						entries(columns).map(([col, { header }]) =>
							isDataColumn(col) && setSortBy ? (
								<th key={col} {...headerSortProps(col)}>
									{header}
									<SortIcon />
								</th>
							) : (
								<th key={col.toString()}>{header}</th>
							),
						)
					)}
				</tr>
				{sortedRows.map((row, i) => (
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
