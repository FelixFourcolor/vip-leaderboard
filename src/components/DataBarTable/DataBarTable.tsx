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
	RowLabel: (row: Omit<Row, "data">) => JSX.Element | null;
	headerLabel: ReactNode;
	colors: Record<Col, string>;
	className?: string;
} & State<"sortBy", Col, { action: false }>;

export function DataBarTable<Col extends string, Row extends DataRow<Col>>({
	rows,
	RowLabel,
	colors,
	headerLabel,
	sortBy,
	setSortBy,
	className,
}: Props<Col, Row>) {
	const sortedRows = useMemo(
		() => rows.toSorted((a, b) => b.data[sortBy] - a.data[sortBy]),
		[rows, sortBy],
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
					<th>Rank</th>
					<th>{headerLabel}</th>
					{keys(sortedRows[0]!.data).map((col) => (
						<th
							key={col}
							aria-sort={sortBy === col ? "descending" : undefined}
							onClick={() => setSortBy(col)}
							tabIndex={0}
						>
							{col}
						</th>
					))}
				</tr>
				{sortedRows.map((row, i) => (
					<tr key={row.id}>
						<td>{i + 1}</td>
						<td>
							<RowLabel {...row} />
						</td>
						{keys(row.data).map((col) => (
							<td key={col}>
								<span
									className={cx("data-bar", { sorted: sortBy === col })}
									style={{
										["--bar-color" as string]: colors[col],
										["--bar-scale" as string]: scales[i],
									}}
								>
									{row.data[col] || ""}
								</span>
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}
