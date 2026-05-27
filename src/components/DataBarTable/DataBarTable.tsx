import classNames from "classnames/bind";
import { type JSX, type ReactNode, useMemo } from "react";
import { keys } from "@/utils/object";
import type { State } from "@/utils/types";
import styles from "./DataBarTable.module.css";

const cx = classNames.bind(styles);

export type DataRow<Col extends string> = {
	id: string;
	data: Record<Col, number>;
};

type Props<Col extends string, Row extends DataRow<Col>> = {
	rows: Row[];
	rowLabel: (row: Omit<Row, "data">) => JSX.Element | null;
	headerLabel: ReactNode;
	colors: Record<Col, string>;
	compare?: (a: Row, b: Row, by: Col) => number;
	className?: string;
} & State<"sortBy", Col, { action: false }>;

const defaultCompare = <Col extends string>(
	a: DataRow<Col>,
	b: DataRow<Col>,
	by: Col,
) => b.data[by] - a.data[by];

export function DataBarTable<Col extends string, Row extends DataRow<Col>>({
	rows,
	rowLabel: RowLabel,
	colors,
	compare = defaultCompare,
	headerLabel,
	sortBy,
	setSortBy,
	className,
}: Props<Col, Row>) {
	const sortedRows = useMemo(
		() => rows.toSorted((a, b) => compare(a, b, sortBy)),
		[rows, sortBy, compare],
	);

	const scales = useMemo(() => {
		if (sortedRows.length === 0) {
			return [];
		}
		const max = sortedRows[0]!.data[sortBy];
		return sortedRows.map((r) => r.data[sortBy] / max);
	}, [sortedRows, sortBy]);

	if (sortedRows.length === 0) {
		return;
	}

	return (
		<table className={cx("data-bar-table", className)}>
			<tbody>
				<tr>
					<th>#</th>
					<th>{headerLabel}</th>
					{keys(colors).map((col) => (
						<th
							key={col}
							className={cx("sortable", { sorted: sortBy === col })}
							aria-sort={sortBy === col ? "descending" : undefined}
							onClick={() => setSortBy(col)}
							tabIndex={sortBy !== col ? 0 : undefined}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									setSortBy(col);
									e.preventDefault();
								}
							}}
						>
							<div>{col}</div>
							<SortIcon />
						</th>
					))}
				</tr>
				{sortedRows.map((row, i) => (
					<tr key={row.id}>
						<td>
							<div>{i + 1}</div>
						</td>
						<td>
							<RowLabel {...row} />
						</td>
						{keys(row.data).map((col) => (
							<td
								key={col}
								className={cx("data", { sorted: sortBy === col })}
								style={{
									["--bar-color" as string]: colors[col],
									["--bar-scale" as string]: scales[i],
								}}
							>
								<div>{row.data[col] || ""}</div>
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

export function SortIcon() {
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
