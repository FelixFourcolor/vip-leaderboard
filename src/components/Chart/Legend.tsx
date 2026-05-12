import classNames from "classnames/bind";
import {
	type UIEventHandler,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useGrab } from "@/components/RangeSlider";
import { Resizer, useResize } from "@/components/Resizer";
import { UserHeader } from "@/components/UserHeader";
import type { RankingData } from "@/db/ranking";
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

	const [legendWidth, setLegendWidth] = useState(140);
	const resizeWidth = useCallback((delta: number) => {
		setLegendWidth((current) => Math.max(Math.min(current + delta, 260), 90));
	}, []);

	const ignoreScroll = useRef(false);
	const previousRank = useRef(1);
	const legendRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: To stay on the same rank when entries change
	useLayoutEffect(() => {
		const legend = legendRef.current;
		if (!legend) {
			return;
		}

		// ignore scrolls triggered by re-rendering the legend
		ignoreScroll.current = true;
		legend.scrollTop = calculateScroll(previousRank.current);
		// If out of bound, the browser will clamp it.
		// So read back the value for the actual rank
		const rank = calculateRank(legend.scrollTop);
		setStartingRank(rank);
		previousRank.current = rank;

		const timeoutId = setTimeout(() => (ignoreScroll.current = false), 100);
		return () => clearTimeout(timeoutId);
	}, [entries, setStartingRank]);

	const onScroll = useCallback<UIEventHandler>(
		({ currentTarget: { scrollTop } }) => {
			if (ignoreScroll.current) {
				return;
			}
			const rank = calculateRank(scrollTop);
			previousRank.current = rank;
			setStartingRank(rank);
		},
		[setStartingRank],
	);

	const values = Object.values(entries);
	return (
		<>
			<div
				style={{ ["--legend-width" as string]: `${legendWidth}px` }}
				className={cx("side-panel")}
				ref={containerRef}
			>
				<div
					className={cx("legend")}
					style={{ maxHeight, gap: GAP }}
					ref={legendRef}
					onScroll={onScroll}
				>
					{values.length > 0 ? (
						values.map((user) => <LegendEntry key={user.id} {...user} />)
					) : (
						<LoadingSpinner size={36} />
					)}
				</div>
			</div>
			<Resizer
				side="left"
				onChange={resizeWidth}
				className={cx("legend-width-resizer")}
			>
				<div />
			</Resizer>
		</>
	);
}

function LegendEntry({ id, count, rank, ...user }: RankingData[string]) {
	const { isHighlighted, setHighlightedUser } = useChart();
	const { isGrabbing } = useGrab();
	const { isResizing } = useResize();

	return (
		<div
			style={{
				boxSizing: "border-box",
				minHeight: `${ENTRY_HEIGHT}px`,
				maxHeight: `${ENTRY_HEIGHT}px`,
				["--series-color" as string]: getSeriesColor({ rank }),
			}}
			className={cx("info-box", { highlighted: isHighlighted(id) })}
			onMouseEnter={() => {
				if (!isResizing && !isGrabbing) {
					setHighlightedUser(id);
				}
			}}
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

const calculateRank = (scrollTop: number) =>
	Math.floor((scrollTop + GAP) / (ENTRY_HEIGHT + GAP)) + 1;

const calculateScroll = (rank: number) => (rank - 1) * (ENTRY_HEIGHT + GAP);
