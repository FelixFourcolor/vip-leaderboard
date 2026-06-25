import classNames from "classnames/bind";
import {
	type ComponentProps,
	type FC,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useDrag } from "@/hooks/useDrag";
import type { AtLeastOneOf, Maybe, OneOf } from "@/utils/types";
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

type Direction = "horizontal" | "vertical";
type Props<S extends TimeSeries> = {
	Entry: FC<LegendEntryProps<S>>;
	entriesGap?: AtLeastOneOf<{ min: number; max: number }>;
	className?: string;
} & OneOf<Record<Direction, true>>;
export function Legend<S extends TimeSeries>({
	Entry,
	vertical,
	entriesGap: { min: minGap = 0, max: maxGap } = { min: 0 },
	className,
}: Props<S>) {
	const direction = vertical ? "vertical" : "horizontal";

	const { isDragging } = useDrag();
	const {
		colors,
		seriesData,
		activeSeries,
		setActiveSeries,
		setVisibleIdx,
		renderReady,
	} = useChart<S>();

	const maxVisibleCount = colors.length;
	const [visibleFrom, setVisibleFrom] = useState(0);
	const [visibleCount, setVisibleCount] = useState(maxVisibleCount);
	const visibleTo = visibleFrom + visibleCount;
	useEffect(() => {
		setVisibleIdx([visibleFrom, visibleTo]);
	}, [setVisibleIdx, visibleFrom, visibleTo]);

	const [entrySize, setEntrySize] = useState<Maybe<number>>();
	const maxSize =
		entrySize && maxGap
			? entrySize * maxVisibleCount + maxGap * (maxVisibleCount - 1)
			: undefined;

	const [gap, setGap] = useState(minGap);
	const legendRef = useRef<HTMLOListElement>(null);
	useEffect(() => {
		const legend = legendRef.current;
		if (!legend || !entrySize) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const rect = entries[0]?.contentRect;
			if (!rect) {
				return;
			}
			const containerSize = direction === "vertical" ? rect.height : rect.width;

			const visibleCount = Math.min(
				Math.floor((containerSize + minGap) / (entrySize + minGap)),
				maxVisibleCount,
			);
			const gap = Math.max(
				(containerSize - entrySize * visibleCount) / (visibleCount - 1),
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
	}, [maxVisibleCount, direction, minGap, maxGap, entrySize]);

	const lastHoveredSeries = useRef<Maybe<string>>(undefined);
	const entriesMapRef = useRef<Record<string, HTMLLIElement>>({});
	useEffect(() => {
		if (activeSeries) {
			entriesMapRef.current[activeSeries]?.focus();
		}
	}, [activeSeries]);

	// scroll to active series when changed externally
	const entryIndexMap = useMemo(() => {
		if (!seriesData) {
			return;
		}
		return Object.fromEntries(
			seriesData.map((series, index) => [series.id, index]),
		);
	}, [seriesData]);
	useEffect(() => {
		if (!activeSeries) {
			return;
		}
		const activeIndex = entryIndexMap?.[activeSeries];
		if (activeIndex === undefined) {
			return;
		}

		setVisibleIdx((current) => {
			if (!current) {
				return current;
			}

			const [currentFrom, currentTo] = current;
			if (currentFrom <= activeIndex && activeIndex < currentTo) {
				return current;
			}

			const legend = legendRef?.current;
			if (entrySize && legend) {
				legend.scrollTo(
					calculateScroll(activeIndex, { entrySize, direction, gap }),
				);
			}

			return [activeIndex, activeIndex + currentTo - currentFrom];
		});
	}, [activeSeries, setVisibleIdx, entryIndexMap, direction, entrySize, gap]);

	const ignoreScroll = useRef(false);
	const prevFromIdx = useRef(0);
	useLayoutEffect(() => {
		const legend = legendRef.current;
		if (!legend || !entrySize || !seriesData) {
			return;
		}

		// ignore scrolls triggered by re-rendering the legend
		ignoreScroll.current = true;
		legend.scrollTo(
			calculateScroll(prevFromIdx.current, { entrySize, direction, gap }),
		);
		// If out of bound, the browser will clamp it.
		// So read back the value for the actual rank
		const index = calculateIdx(legend, { entrySize, direction, gap });
		setVisibleFrom(index);
		prevFromIdx.current = index;

		const timeoutId = setTimeout(() => (ignoreScroll.current = false), 100);
		return () => clearTimeout(timeoutId);
	}, [seriesData, entrySize, direction, gap]);

	const isEntryFocusedRef = useRef(false);
	return (
		<ol
			style={{
				gap,
				...(direction === "vertical"
					? { maxHeight: maxSize }
					: { maxWidth: maxSize }),
			}}
			ref={legendRef}
			onScroll={({ currentTarget }) => {
				if (ignoreScroll.current || !entrySize) {
					return;
				}
				const index = calculateIdx(currentTarget, {
					entrySize,
					direction,
					gap,
				});
				prevFromIdx.current = index;
				setVisibleFrom(index);
			}}
			className={cx("legend", direction, className)}
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
			tabIndex={-1}
		>
			{renderReady && seriesData ? (
				seriesData.map((series, i) => (
					<Entry
						key={series.id}
						series={series}
						seriesIndex={i}
						ref={(entry) => {
							if (!entry) {
								return;
							}
							entriesMapRef.current[series.id] = entry;
							// measure entry size
							// entries are assumed to be the same size, so just take the 1st
							if (i === 0 && !entrySize) {
								const rect = entry.getBoundingClientRect();
								const entrySize =
									direction === "vertical" ? rect.height : rect.width;
								setEntrySize(entrySize);
							}
						}}
						seriesColor={colors[i % colors.length]!}
						onMouseEnter={() => {
							if (
								!isDragging &&
								(!activeSeries || lastHoveredSeries.current !== series.id)
							) {
								lastHoveredSeries.current = series.id;
								setActiveSeries(series.id);
							}
						}}
						onMouseLeave={() => setActiveSeries(undefined)}
						onFocus={() => {
							const legend = legendRef.current;
							if (!legend || !entrySize) {
								return;
							}

							if (i >= visibleTo) {
								legend.scrollTo(
									calculateScroll(i, { entrySize, direction, gap }),
								);
							} else if (i < visibleFrom) {
								legend.scrollTo(
									calculateScroll(Math.max(0, i - visibleCount + 1), {
										entrySize,
										direction,
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

type ScrollArgs = { entrySize: number; direction: Direction; gap: number };

function calculateIdx(
	{ scrollTop, scrollLeft }: { scrollTop: number; scrollLeft: number },
	{ entrySize, direction, gap }: ScrollArgs,
) {
	const scroll = direction === "vertical" ? scrollTop : scrollLeft;
	return Math.floor((scroll + gap) / (entrySize + gap));
}

function calculateScroll(
	index: number,
	{ entrySize, direction, gap }: ScrollArgs,
) {
	const pos = index * (entrySize + gap);
	return direction === "vertical" ? { top: pos } : { left: pos };
}
