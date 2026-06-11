import classNames from "classnames/bind";
import {
	type ComponentProps,
	type FC,
	type UIEventHandler,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useGrab } from "@/components/RangeSlider";
import { useResize } from "@/components/Resizer";
import type { AtLeastOneOf, Maybe } from "@/utils/types";
import type { TimeSeries } from "./ChartWrapper";
import { useChart } from "./chartContext";
import styles from "./TimeChart.module.css";

const cx = classNames.bind(styles);

export type LegendEntryProps<S extends TimeSeries> = {
	series: Omit<S, "data">;
	seriesColor: string;
	seriesIndex: number;
} & Pick<
	ComponentProps<"li">,
	"onFocus" | "onBlur" | "onKeyDown" | "onMouseEnter" | "onMouseLeave" | "ref"
>;

type Props<S extends TimeSeries> = {
	Entry: FC<LegendEntryProps<S>>;
	entriesGap?: AtLeastOneOf<{ min: number; max: number }>;
	className?: string;
};
export function Legend<S extends TimeSeries>({
	Entry,
	entriesGap: { min: minGap = 0, max: maxGap } = { min: 0 },
	className,
}: Props<S>) {
	const { isGrabbing } = useGrab();
	const { isResizing } = useResize();
	const { colors, seriesData, setActiveSeries, setVisibleIdx, renderReady } =
		useChart<S>();

	const maxVisibleCount = colors.length;
	const [visibleFrom, setVisibleFrom] = useState(0);
	const [visibleCount, setVisibleCount] = useState(maxVisibleCount);
	const visibleTo = visibleFrom + visibleCount;
	useEffect(() => {
		setVisibleIdx([visibleFrom, visibleTo]);
	}, [setVisibleIdx, visibleFrom, visibleTo]);

	const [entryHeight, setEntryHeight] = useState<Maybe<number>>();
	const entryRef = (entry: HTMLLIElement | null) => {
		if (entry && !entryHeight) {
			const entryHeight = entry.getBoundingClientRect().height;
			setEntryHeight(entryHeight);
		}
	};
	const maxHeight =
		entryHeight && maxGap
			? entryHeight * maxVisibleCount + maxGap * (maxVisibleCount - 1)
			: undefined;

	const [gap, setGap] = useState(minGap);
	const legendRef = useRef<HTMLOListElement>(null);
	useEffect(() => {
		const legend = legendRef.current;
		if (!legend || !entryHeight) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const containerHeight = entries[0]?.contentRect.height;
			if (!containerHeight) {
				return;
			}

			const visibleCount = Math.min(
				Math.floor((containerHeight + minGap) / (entryHeight + minGap)),
				maxVisibleCount,
			);
			const gap = Math.max(
				(containerHeight - entryHeight * visibleCount) / (visibleCount - 1),
				minGap,
			);

			setVisibleCount(visibleCount);
			setGap(
				visibleCount === maxVisibleCount && maxGap
					? Math.min(gap, maxGap)
					: gap,
			);
		});

		observer.observe(legend);
		return () => observer.disconnect();
	}, [maxVisibleCount, minGap, maxGap, entryHeight]);

	const ignoreScroll = useRef(false);
	const prevFromIdx = useRef(0);
	useLayoutEffect(() => {
		const legend = legendRef.current;
		if (!legend || !entryHeight || !seriesData) {
			return;
		}

		// ignore scrolls triggered by re-rendering the legend
		ignoreScroll.current = true;
		legend.scrollTo(calculateScroll(prevFromIdx.current, { entryHeight, gap }));
		// If out of bound, the browser will clamp it.
		// So read back the value for the actual rank
		const index = calculateIdx(legend.scrollTop, { entryHeight, gap });
		setVisibleFrom(index);
		prevFromIdx.current = index;

		const timeoutId = setTimeout(() => (ignoreScroll.current = false), 100);
		return () => clearTimeout(timeoutId);
	}, [seriesData, entryHeight, gap]);

	const onScroll = useCallback<UIEventHandler>(
		({ currentTarget: { scrollTop } }) => {
			if (ignoreScroll.current || !entryHeight) {
				return;
			}
			const index = calculateIdx(scrollTop, { entryHeight, gap });
			prevFromIdx.current = index;
			setVisibleFrom(index);
		},
		[entryHeight, gap],
	);

	const isEntryFocusedRef = useRef(false);
	return (
		<ol
			style={{ gap, maxHeight }}
			ref={legendRef}
			onScroll={onScroll}
			className={cx("legend", className)}
			onKeyDown={(e) => {
				if (
					isEntryFocusedRef.current &&
					(e.key === "ArrowDown" || e.key === "ArrowUp")
				) {
					// prevent native keyboard scrolling
					// because we're manually controlling the scroll to snap to entry
					e.preventDefault();
				}
			}}
		>
			{renderReady && seriesData ? (
				seriesData.map((series, i) => (
					<Entry
						key={series.id}
						series={series}
						seriesIndex={i}
						ref={i === 0 ? entryRef : undefined}
						seriesColor={colors[i % colors.length]!}
						onMouseEnter={() => {
							if (!isResizing && !isGrabbing) {
								setActiveSeries(series.id);
							}
						}}
						onMouseLeave={() => setActiveSeries(undefined)}
						onFocus={() => {
							const legend = legendRef.current;
							if (!legend || !entryHeight) {
								return;
							}

							if (i >= visibleTo) {
								legend.scrollTo(calculateScroll(i, { entryHeight, gap }));
							} else if (i < visibleFrom) {
								legend.scrollTo(
									calculateScroll(Math.max(0, i - visibleCount + 1), {
										entryHeight,
										gap,
									}),
								);
							}
							isEntryFocusedRef.current = true;
							setActiveSeries(series.id);
						}}
						onBlur={() => {
							isEntryFocusedRef.current = false;
							setActiveSeries((current) =>
								current === series.id ? undefined : current,
							);
						}}
						onKeyDown={({
							key,
							currentTarget: { nextSibling, previousSibling },
						}) => {
							if (key === "ArrowDown") {
								(nextSibling as HTMLElement | null)?.focus();
							} else if (key === "ArrowUp") {
								(previousSibling as HTMLElement | null)?.focus();
							}
						}}
					/>
				))
			) : (
				<LoadingSpinner size={36} />
			)}
		</ol>
	);
}

const calculateIdx = (
	scrollTop: number,
	{ entryHeight, gap }: { entryHeight: number; gap: number },
) => Math.floor((scrollTop + gap) / (entryHeight + gap));

const calculateScroll = (
	index: number,
	{ entryHeight, gap }: { entryHeight: number; gap: number },
) => ({ top: index * (entryHeight + gap) });
