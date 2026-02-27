import classNames from "classnames/bind";
import { useCallback, useEffect, useRef, useState } from "react";
import { UserHeader } from "@/components/UserHeader";
import type { RankingData } from "@/db/ranking";
import styles from "./Chart.module.css";
import { useChartControls } from "./ChartControls";
import { COLORS_COUNT, getSeriesColor } from "./colors";
import { useChart } from "./context";

const cx = classNames.bind(styles);

export function ChartLegend({ entries }: { entries: RankingData }) {
	const entriesCount = Object.keys(entries).length;

	const [{ from, to }, setParams] = useChartControls();
	const [scrolling, setIsScrolling] = useState(false);
	const [visibleCount, setVisibleCount] = useState(to - from + 1);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const updateParams = useCallback(
		({ scrollTop }: { scrollTop: number }) => {
			const topIndex = Math.floor((scrollTop + GAP) / (ENTRY_HEIGHT + GAP));
			const from = topIndex + 1;
			const to = Math.min(topIndex + visibleCount, entriesCount);
			setParams({ from, to });
		},
		[visibleCount, entriesCount, setParams],
	);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (container) {
			updateParams(container);
		}
	}, [updateParams]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scrolling left out to prevent scroll jumping when user scrolls manually (but is a state rather than ref because LegendEntry depends on it)
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container || !entriesCount || scrolling) {
			return;
		}
		container.scrollTop = (from - 1) * (ENTRY_HEIGHT + GAP);
	}, [from, entriesCount]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}
			const containerHeight = entry.contentRect.height;
			setVisibleCount(
				Math.floor((containerHeight + GAP) / (ENTRY_HEIGHT + GAP)),
			);
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	return (
		<div className={cx("side-panel")}>
			<div
				className={cx("legend")}
				style={{
					maxHeight: ENTRY_HEIGHT * COLORS_COUNT + GAP * (COLORS_COUNT - 1),
				}}
				onScroll={({ currentTarget }) => {
					setIsScrolling(true);
					updateParams(currentTarget);
				}}
				onScrollEnd={() => setIsScrolling(false)}
				ref={scrollContainerRef}
			>
				{Object.values(entries).map((user) => (
					<LegendEntry key={user.id} {...user} scrolling={scrolling} />
				))}
			</div>
		</div>
	);
}

type EntryProps = RankingData[string] & {
	scrolling: boolean;
};

function LegendEntry({ scrolling, id, count, rank, ...userData }: EntryProps) {
	const { highlightedUser, setHighlightedUser } = useChart();
	return (
		<div
			style={{ ["--series-color" as string]: getSeriesColor({ rank }) }}
			className={cx("info-box", {
				highlighted: !scrolling && highlightedUser === id,
			})}
			onMouseEnter={() => !scrolling && setHighlightedUser(id)}
			onMouseLeave={() => setHighlightedUser(undefined)}
		>
			<UserHeader {...userData} />
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

const ENTRY_HEIGHT = 53;
const GAP = 24;
