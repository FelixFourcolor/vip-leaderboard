import {
	type CSSProperties,
	type FC,
	type ReactNode,
	type Ref,
	type UIEventHandler,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useChart } from "./context";
import type { ChartSeries } from "./TimeChart";

export type VisibleIndices = { from: number; to: number };

export type LegendContainerProps = {
	style: CSSProperties;
	ref: Ref<any>;
	onScroll: UIEventHandler;
	children: ReactNode;
};

export type LegendEntryProps<S extends ChartSeries> = {
	series: Omit<S, "data">;
	seriesColor: string;
	ref?: Ref<any>;
};

type Props<S extends ChartSeries> = {
	data: Omit<S, "data">[];
	Container?: FC<LegendContainerProps>;
	Entry: FC<LegendEntryProps<S>>;
};
export function Legend<S extends ChartSeries>({
	data,
	Container = (props) => <div {...props} />,
	Entry,
}: Props<S>) {
	const {
		colors,
		visibleIndices = defaultIndexRange(colors),
		setVisibleIndices,
	} = useChart();

	const setFromIndex = useCallback(
		(index: number) =>
			setVisibleIndices((current = defaultIndexRange(colors)) => {
				const delta = index - current.from;
				return {
					from: index,
					to: current.to + delta,
				};
			}),
		[colors, setVisibleIndices],
	);
	const setIndicesCount = useCallback(
		(count: number) =>
			setVisibleIndices((current = defaultIndexRange(colors)) => ({
				...current,
				to: current.from + count - 1,
			})),
		[colors, setVisibleIndices],
	);

	const [entryHeight, setEntryHeight] = useState<number | undefined>();
	const entryRef = (entry: HTMLDivElement | null) => {
		if (entry && !entryHeight) {
			const { height } = entry.getBoundingClientRect();
			setEntryHeight(height);
		}
	};
	const maxHeight = entryHeight
		? entryHeight * visibleCount(visibleIndices) +
			gap * (visibleCount(visibleIndices) - 1)
		: undefined;

	const legendRef = useRef<HTMLElement>(null);
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
			setIndicesCount(Math.floor(containerHeight / (entryHeight + gap)));
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, [entryHeight, setIndicesCount]);

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
		<Container
			style={{ maxHeight, gap, overflowY: "auto" }}
			ref={legendRef}
			onScroll={onScroll}
		>
			{data.length > 0 ? (
				data.map((series, i) => (
					<Entry
						key={series.id}
						series={series}
						ref={i === 0 ? entryRef : undefined}
						seriesColor={colors[series.id]!}
					/>
				))
			) : (
				<LoadingSpinner size={36} />
			)}
		</Container>
	);
}

const defaultIndexRange = (colors: Record<string, string>) => ({
	from: 0,
	to: Object.values(colors).length - 1,
});

const visibleCount = (visibleIndices: { from: number; to: number }) =>
	visibleIndices.to - visibleIndices.from + 1;

const gap = 24;

const calculateIndex = (scrollTop: number, entryHeight: number) =>
	Math.floor((scrollTop + gap) / (entryHeight + gap));

const calculateScroll = (index: number, entryHeight: number) =>
	index * (entryHeight + gap);
