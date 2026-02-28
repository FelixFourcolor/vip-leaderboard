import classNames from "classnames/bind";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { UserHeader } from "@/components/UserHeader";
import type { RankingData } from "@/db/ranking";
import styles from "./Chart.module.css";
import { useChartControls } from "./ChartControls";
import { COLORS_COUNT, getSeriesColor } from "./colors";
import { useChart } from "./context";

const cx = classNames.bind(styles);

type LegendProps = Pick<ComponentProps<"div">, "ref"> & {
	entries: RankingData;
	visibleCount: number;
};

export function ChartLegend({ entries, visibleCount, ref }: LegendProps) {
	const [{ fromRank }, setParams] = useChartControls();
	const [scrolling, setIsScrolling] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	const entriesCount = Object.keys(entries).length;
	// biome-ignore lint/correctness/useExhaustiveDependencies: scrolling left out to prevent scroll jumping when user scrolls manually (but is a state rather than ref because LegendEntry depends on it)
	useEffect(() => {
		const scroller = scrollRef.current;
		if (!scroller || !entriesCount || scrolling) {
			return;
		}
		scroller.scrollTop = (fromRank - 1) * (ENTRY_HEIGHT + GAP);
	}, [fromRank, entriesCount]);

	const maxHeight = ENTRY_HEIGHT * visibleCount + GAP * (visibleCount - 1);

	return (
		<div className={cx("side-panel")} ref={ref}>
			<div
				className={cx("legend")}
				style={{ maxHeight }}
				onScroll={({ currentTarget: { scrollTop } }) => {
					setIsScrolling(true);
					setParams({
						fromRank: Math.floor((scrollTop + GAP) / (ENTRY_HEIGHT + GAP)) + 1,
					});
				}}
				onScrollEnd={() => setIsScrolling(false)}
				ref={scrollRef}
			>
				{Object.values(entries).map((user) => (
					<LegendEntry key={user.id} {...user} scrolling={scrolling} />
				))}
			</div>
		</div>
	);
}

const ENTRY_HEIGHT = 53;
const GAP = 24;

export function useVisibleCount() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [visibleCount, setVisibleCount] = useState<number>(COLORS_COUNT);

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
			setVisibleCount(Math.min(count, COLORS_COUNT));
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	return [visibleCount, containerRef] as const;
}

type EntryProps = RankingData[string] & { scrolling: boolean };

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
