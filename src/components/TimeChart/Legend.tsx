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
import type { Maybe } from "@/utils/types";
import type { TimeSeries } from "./ChartWrapper";
import { useChart } from "./context";
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
	gap?: number;
	className?: string;
};
export function Legend<S extends TimeSeries>({
	Entry,
	gap = 24,
	className,
}: Props<S>) {
	const { isGrabbing } = useGrab();
	const { isResizing } = useResize();
	const { colors, seriesData, setActiveSeries, setVisibleIdx, renderReady } =
		useChart<S>();

	const [visibleFrom, setVisibleFrom] = useState(0);
	const [visibleCount, setVisibleCount] = useState(colors.length);
	const visibleTo = visibleFrom + visibleCount;
	useEffect(() => {
		setVisibleIdx([visibleFrom, visibleTo]);
	}, [setVisibleIdx, visibleFrom, visibleTo]);

	const [entryHeight, setEntryHeight] = useState<Maybe<number>>();
	const entryRef = (entry: HTMLLIElement | null) => {
		if (entry && !entryHeight) {
			const { height } = entry.getBoundingClientRect();
			setEntryHeight(height);
		}
	};
	const maxHeight = entryHeight
		? entryHeight * visibleCount + gap * (visibleCount - 1)
		: undefined;

	const legendRef = useRef<HTMLOListElement>(null);
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
					Math.floor(containerHeight / (entryHeight + gap)),
					colors.length,
				),
			);
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, [colors, gap, entryHeight]);

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
			style={{ maxHeight, gap }}
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
