import classNames from "classnames/bind";
import { type FC, type KeyboardEvent, type ReactNode, useMemo } from "react";
import { entries, keys } from "@/utils/object";
import type { State } from "@/utils/types";
import styles from "./DataBarTable.module.css";

const cx = classNames.bind(styles);

type DataRow<Col extends string> = {
	id: string;
	data: Record<Col, number>;
};

type Renderer<Row> = {
	header: ReactNode;
	data?: FC<{ row: Row; index: number }>;
};

type Props<Col extends string, Row extends DataRow<Col>> = {
	data: Row[];
	renderers: Record<Col, Renderer<Row>> & {
		[K in Exclude<keyof Row, "data"> | "$index"]?: Renderer<Row>;
	};
	colors: Record<Col, string>;
	compare?: (a: Row, b: Row, by: Col) => number;
	className?: string;
} & State<"sortBy", Col, { action: false }>;

export function DataBarTable<Col extends string, Row extends DataRow<Col>>({
	data,
	renderers,
	colors,
	compare = defaultCompare,
	sortBy,
	setSortBy,
	className,
}: Props<Col, Row>) {
	const sortedRows = useMemo(
		() => data.toSorted((a, b) => compare(a, b, sortBy)),
		[data, sortBy, compare],
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

	const dataColumns = keys(colors);
	const isDataColumn = (col: any): col is Col => dataColumns.includes(col);

	const dataHeaderProps = (col: Col) => ({
		className: cx("sortable", { sorted: sortBy === col }),
		"aria-sort": sortBy === col ? ("descending" as const) : undefined,
		onClick: () => setSortBy(col),
		tabIndex: sortBy === col ? -1 : 0,
		onKeyDown: (e: KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				setSortBy(col);
				e.preventDefault();
			}
		},
	});

	const dataRowProps = (col: Col, index: number) => ({
		className: cx("data", { sorted: sortBy === col }),
		style: {
			["--bar-color" as string]: colors[col],
			["--bar-scale" as string]: scales[index],
		},
	});

	console.log(renderers);

	return (
		<table className={cx("data-bar-table", className)}>
			<tbody>
				<tr>
					{entries(renderers).map(([col, { header }]) =>
						isDataColumn(col) ? (
							<th key={col} {...dataHeaderProps(col)}>
								{header}
								<SortIcon />
							</th>
						) : (
							<th key={col.toString()}>{header}</th>
						),
					)}
				</tr>
				{sortedRows.map((row, i) => (
					<tr key={row.id}>
						{entries(renderers).map(([col, { data: Data }]) =>
							isDataColumn(col) ? (
								<td key={col} {...dataRowProps(col, i)}>
									{Data ? <Data row={row} index={i} /> : row.data[col]}
								</td>
							) : (
								<td key={col.toString()}>
									{Data ? (
										<Data row={row} index={i} />
									) : col === "$index" ? (
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

const defaultCompare = <Col extends string>(
	a: DataRow<Col>,
	b: DataRow<Col>,
	by: Col,
) => b.data[by] - a.data[by];

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
