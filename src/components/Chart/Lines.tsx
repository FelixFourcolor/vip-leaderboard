import { useAnimatedPath } from "@nivo/core";
import type { LineCustomSvgLayerProps } from "@nivo/line";
import { animated } from "@react-spring/web";
import { useIsZack } from "@/hooks/useIsZack";
import type { ChartSeries } from "./Chart";
import { useChart } from "./context";

export function ChartLines({
	series,
	lineGenerator,
}: LineCustomSvgLayerProps<ChartSeries>) {
	return (
		<g>
			{series.map(({ id, data, color }) => (
				<Line
					key={id}
					id={id}
					path={lineGenerator(data.map((d) => d.position)) ?? ""}
					color={color}
				/>
			))}
		</g>
	);
}

type LineProps = {
	id: string;
	path: string;
	color: string;
};

function Line({ id, path, color }: LineProps) {
	const isZack = useIsZack();
	const { highlightedUser } = useChart();

	const highlighted = highlightedUser === id;
	const dimmed = highlightedUser && !highlighted;

	return (
		<g>
			{highlighted && (
				<path
					d={path}
					fill="none"
					stroke={color}
					strokeWidth={6}
					strokeOpacity={isZack ? 0.25 : 0.4}
					style={{ filter: "blur(3px)" }}
				/>
			)}
			<animated.path
				d={useAnimatedPath(path)}
				fill="none"
				stroke={color}
				strokeWidth={dimmed ? 1 : 2}
			/>
		</g>
	);
}
