import {
	type ComponentProps,
	type FC,
	type UIEventHandler,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useGrab } from "@/components/RangeSlider";
import { useResize } from "@/components/Resizer";
import { useChart } from "./context";
import type { TimeSeries } from "./TimeChartProvider";

export type VisibleIdx = { from: number; to: number };

export type LegendEntryProps<S extends TimeSeries> = {
	series: Omit<S, "data">;
	seriesColor: string;
} & Pick<
	ComponentProps<"div">,
	"onFocus" | "onBlur" | "onKeyDown" | "onMouseEnter" | "onMouseLeave" | "ref"
>;

type Props<S extends TimeSeries> = {
	Entry: FC<LegendEntryProps<S>>;
	className?: string;
};
export function Legend<S extends TimeSeries>({ Entry, className }: Props<S>) {
	const { isGrabbing } = useGrab();
	const { isResizing } = useResize();

	const { data, colorMapping } = useChart<S>();
	const colors = useMemo(
		() => [...new Set(Object.values(colorMapping))],
		[colorMapping],
	);
	const {
		visibleIdx = colorRange(colors),
		setVisibleIdx,
		setFocusedSeries,
	} = useChart();

	const setVisibleFrom = useCallback(
		(index: number) =>
			setVisibleIdx((current = colorRange(colors)) => {
				const delta = index - current.from;
				return {
					from: index,
					to: current.to + delta,
				};
			}),
		[colors, setVisibleIdx],
	);
	const setVisibleCount = useCallback(
		(count: number) =>
			setVisibleIdx((current = colorRange(colors)) => ({
				...current,
				to: current.from + count - 1,
			})),
		[colors, setVisibleIdx],
	);

	const [entryHeight, setEntryHeight] = useState<number | undefined>();
	const entryRef = (entry: HTMLDivElement | null) => {
		if (entry && !entryHeight) {
			const { height } = entry.getBoundingClientRect();
			setEntryHeight(height);
		}
	};
	const maxHeight = entryHeight
		? entryHeight * visibleCount(visibleIdx) +
			GAP * (visibleCount(visibleIdx) - 1)
		: undefined;

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
			setVisibleCount(
				Math.min(
					Math.floor(containerHeight / (entryHeight + GAP)),
					colors.length,
				),
			);
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, [colors, entryHeight, setVisibleCount]);

	const ignoreScroll = useRef(false);
	const prevFromIdx = useRef(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: to stay on the same index when data change
	useLayoutEffect(() => {
		const legend = legendRef.current;
		if (!legend || !entryHeight) {
			return;
		}

		// ignore scrolls triggered by re-rendering the legend
		ignoreScroll.current = true;
		legend.scrollTo(calculateScroll(prevFromIdx.current, entryHeight));
		// If out of bound, the browser will clamp it.
		// So read back the value for the actual rank
		const index = calculateIdx(legend.scrollTop, entryHeight);
		setVisibleFrom(index);
		prevFromIdx.current = index;

		const timeoutId = setTimeout(() => (ignoreScroll.current = false), 100);
		return () => clearTimeout(timeoutId);
	}, [data, setVisibleFrom]);

	const onScroll = useCallback<UIEventHandler>(
		({ currentTarget: { scrollTop } }) => {
			if (ignoreScroll.current || !entryHeight) {
				return;
			}
			const index = calculateIdx(scrollTop, entryHeight);
			prevFromIdx.current = index;
			setVisibleFrom(index);
		},
		[setVisibleFrom, entryHeight],
	);

	const isEntryFocusedRef = useRef(false);

	return (
		<div
			style={{ maxHeight, gap: GAP, overflowY: "auto" }}
			ref={legendRef}
			onScroll={onScroll}
			className={className}
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
			{data ? (
				data.map((series, i) => (
					<Entry
						key={series.id}
						series={series}
						ref={i === 0 ? entryRef : undefined}
						seriesColor={colorMapping[series.id]!}
						onMouseEnter={() => {
							if (!isResizing && !isGrabbing) {
								setFocusedSeries(series.id);
							}
						}}
						onMouseLeave={() => setFocusedSeries(undefined)}
						onFocus={() => {
							const legend = legendRef.current;
							if (!legend || !entryHeight) {
								return;
							}

							if (i > visibleIdx.to) {
								legend.scrollTo(calculateScroll(i, entryHeight));
							} else if (i < visibleIdx.from) {
								legend.scrollTo(
									calculateScroll(
										Math.max(0, i - visibleCount(visibleIdx) + 1),
										entryHeight,
									),
								);
							}
							isEntryFocusedRef.current = true;
							setFocusedSeries(series.id);
						}}
						onBlur={() => {
							isEntryFocusedRef.current = false;
							setFocusedSeries((current) =>
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
		</div>
	);
}

const colorRange = (colors: readonly string[]) => ({
	from: 0,
	to: colors.length - 1,
});

const visibleCount = (visibleIdx: { from: number; to: number }) =>
	visibleIdx.to - visibleIdx.from + 1;

const GAP = 24;

const calculateIdx = (scrollTop: number, entryHeight: number) =>
	Math.floor((scrollTop + GAP) / (entryHeight + GAP));

const calculateScroll = (index: number, entryHeight: number) => ({
	top: index * (entryHeight + GAP),
});
