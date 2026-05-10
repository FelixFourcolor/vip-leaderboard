import classNames from "classnames/bind";
import { useEffect, useRef } from "react";
import { UserHeader } from "@/components/UserHeader";
import type { RankingData } from "@/db/ranking";
import { LoadingSpinner } from "../LoadingSpinner";
import styles from "./Chart.module.css";
import { colorsCount, getSeriesColor } from "./colors";
import { useChart } from "./context";

const cx = classNames.bind(styles);

type LegendProps = { entries: RankingData };
export function ChartLegend({ entries }: LegendProps) {
	const { setStartingRank, visibleRanks, setVisibleRanks } = useChart();
	const maxHeight = ENTRY_HEIGHT * visibleRanks + GAP * (visibleRanks - 1);

	const containerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}
			const containerHeight = entry.contentRect.height;
			const count = Math.floor(containerHeight / (ENTRY_HEIGHT + GAP));
			setVisibleRanks(Math.min(count, colorsCount));
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, [setVisibleRanks]);

	const values = Object.values(entries);
	return (
		<div className={cx("side-panel")} ref={containerRef}>
			<div
				className={cx("legend")}
				style={{ maxHeight, gap: GAP }}
				onScroll={({ currentTarget: { scrollTop } }) => {
					setStartingRank(
						Math.floor((scrollTop + GAP) / (ENTRY_HEIGHT + GAP)) + 1,
					);
				}}
			>
				{values.length > 0 ? (
					values.map((user) => <LegendEntry key={user.id} {...user} />)
				) : (
					<LoadingSpinner size={36} />
				)}
			</div>
		</div>
	);
}

function LegendEntry({ id, count, rank, ...user }: RankingData[string]) {
	const { isHighlighted, setHighlightedUser } = useChart();

	return (
		<div
			style={{
				boxSizing: "border-box",
				minHeight: `${ENTRY_HEIGHT}px`,
				maxHeight: `${ENTRY_HEIGHT}px`,
				["--series-color" as string]: getSeriesColor({ rank }),
			}}
			className={cx("info-box", { highlighted: isHighlighted(id) })}
			onMouseEnter={() => setHighlightedUser(id)}
			onMouseLeave={() => setHighlightedUser(undefined)}
		>
			<UserHeader {...user} />
			<table>
				<tbody>
					<tr>
						<th>#{rank}</th>
						<td>{count}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}

const ENTRY_HEIGHT = 54; // pre-measured based on current styles, not worth measuring at runtime
const GAP = 24;
