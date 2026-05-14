import classNames from "classnames/bind";
import {
	type CSSProperties,
	type Ref,
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

	const [entryHeight, setEntryHeight] = useState<number | undefined>();
	const entryRef = (entry: HTMLDivElement | null) => {
		if (entry) {
			const { height } = entry.getBoundingClientRect();
			setEntryHeight(height);
		}
	};

	const legendRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const container = legendRef.current?.parentElement;
		if (!container || !entryHeight) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}
			const containerHeight = entry.contentRect.height;
			const count = Math.floor(containerHeight / (entryHeight + gap));
			setVisibleRanks(Math.min(count, colorsCount));
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, [entryHeight, setVisibleRanks]);

	const [legendWidth, setLegendWidth] = useState(140);
	const resizeWidth = useCallback((delta: number) => {
		setLegendWidth((current) => Math.max(Math.min(current + delta, 260), 90));
	}, []);

	const ignoreScroll = useRef(false);
	const previousRank = useRef(1);

	// biome-ignore lint/correctness/useExhaustiveDependencies: To stay on the same rank when entries change
	useLayoutEffect(() => {
		const legend = legendRef.current;
		if (!legend || !entryHeight) {
			return;
		}

		// ignore scrolls triggered by re-rendering the legend
		ignoreScroll.current = true;
		legend.scrollTop = calculateScroll(previousRank.current, entryHeight);
		// If out of bound, the browser will clamp it.
		// So read back the value for the actual rank
		const rank = calculateRank(legend.scrollTop, entryHeight);
		setStartingRank(rank);
		previousRank.current = rank;

		const timeoutId = setTimeout(() => (ignoreScroll.current = false), 100);
		return () => clearTimeout(timeoutId);
	}, [entries, entryHeight, setStartingRank]);

	const onScroll = useCallback<UIEventHandler>(
		({ currentTarget: { scrollTop } }) => {
			if (ignoreScroll.current || !entryHeight) {
				return;
			}
			const rank = calculateRank(scrollTop, entryHeight);
			previousRank.current = rank;
			setStartingRank(rank);
		},
		[entryHeight, setStartingRank],
	);

	const maxHeight = entryHeight
		? entryHeight * visibleRanks + gap * (visibleRanks - 1)
		: undefined;

	const values = Object.values(entries);

	return (
		<>
			<div
				style={{ ["--legend-width" as string]: `${legendWidth}px` }}
				className={cx("side-panel")}
			>
				<div
					className={cx("legend")}
					style={{ maxHeight, gap }}
					ref={legendRef}
					onScroll={onScroll}
				>
					{values.length > 0 ? (
						values.map((user, i) => (
							<LegendEntry
								key={user.id}
								user={user}
								ref={i === 0 ? entryRef : undefined}
							/>
						))
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

type LegendEntryProps = {
	user: RankingData[string];
	ref?: Ref<HTMLDivElement>;
	style?: CSSProperties;
};

function LegendEntry({
	user: { id, rank, count, ...user },
	ref,
	style,
}: LegendEntryProps) {
	const { isHighlighted, setHighlightedUser } = useChart();
	const { isGrabbing } = useGrab();
	const { isResizing } = useResize();

	return (
		<div
			ref={ref}
			style={{
				boxSizing: "border-box",
				["--series-color" as string]: getSeriesColor({ rank }),
				...style,
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

const gap = 24;

const calculateRank = (scrollTop: number, entryHeight: number) =>
	Math.floor((scrollTop + gap) / (entryHeight + gap)) + 1;

const calculateScroll = (rank: number, entryHeight: number) =>
	(rank - 1) * (entryHeight + gap);
