import {
	type FC,
	type Ref,
	type UIEventHandler,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useChart } from "./context";
import type { TimeSeries } from "./TimeChartProvider";

export type VisibleIdx = { from: number; to: number };

export type LegendEntryProps<S extends TimeSeries> = {
	series: Omit<S, "data">;
	seriesColor: string;
	ref?: Ref<any>;
};

type Props<S extends TimeSeries> = {
	Entry: FC<LegendEntryProps<S>>;
	className?: string;
};
export function Legend<S extends TimeSeries>({ Entry, className }: Props<S>) {
	const { data, colorMapping } = useChart<S>();
	const colors = useMemo(
		() => [...new Set(Object.values(colorMapping))],
		[colorMapping],
	);
	const { visibleIdx = colorRange(colors), setVisibleIdx } = useChart();

	const setFromIndex = useCallback(
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
	const setIndicesCount = useCallback(
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
			gap * (visibleCount(visibleIdx) - 1)
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
			setIndicesCount(
				Math.min(
					Math.floor(containerHeight / (entryHeight + gap)),
					colors.length,
				),
			);
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, [colors, entryHeight, setIndicesCount]);

	const ignoreScroll = useRef(false);
	const prevFromIndex = useRef(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: to stay on the same index when data change
	useLayoutEffect(() => {
		const legend = legendRef.current;
		if (!legend || !entryHeight) {
			return;
		}

		legend.scrollTop = calculateScroll(prevFromIndex.current, entryHeight);
		// If out of bound, the browser will clamp it.
		// So read back the value for the actual rank
		const index = calculateIndex(legend.scrollTop, entryHeight);
		setFromIndex(index);
		prevFromIndex.current = index;

		// ignore scrolls triggered by re-rendering the legend
		ignoreScroll.current = true;
		const timeoutId = setTimeout(() => (ignoreScroll.current = false), 100);
		return () => clearTimeout(timeoutId);
	}, [data, setFromIndex]);

	const onScroll = useCallback<UIEventHandler>(
		({ currentTarget: { scrollTop } }) => {
			if (ignoreScroll.current || !entryHeight) {
				return;
			}
			const index = calculateIndex(scrollTop, entryHeight);
			prevFromIndex.current = index;
			setFromIndex(index);
		},
		[setFromIndex, entryHeight],
	);

	return (
		<div
			style={{ maxHeight, gap, overflowY: "auto" }}
			ref={legendRef}
			onScroll={onScroll}
			className={className}
		>
			{data.length > 0 ? (
				data.map((series, i) => (
					<Entry
						key={series.id}
						series={series}
						ref={i === 0 ? entryRef : undefined}
						seriesColor={colorMapping[series.id]!}
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

const gap = 24;

const calculateIndex = (scrollTop: number, entryHeight: number) =>
	Math.floor((scrollTop + gap) / (entryHeight + gap));

const calculateScroll = (index: number, entryHeight: number) =>
	index * (entryHeight + gap);
