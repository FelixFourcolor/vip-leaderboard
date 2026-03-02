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

	const highlight = (() => {
		if (!highlighted) {
			return 0;
		}
		return isZack ? 0.25 : 0.4;
	})();
	const opacity = (() => {
		if (highlighted) {
			return 1;
		}
		if (!dimmed) {
			return 0.9;
		}
		return isZack ? 0.5 : 0.4;
	})();
	const width = dimmed ? 1 : 2;

	return (
		<g>
			{highlight && (
				<path
					d={path}
					fill="none"
					stroke={color}
					strokeWidth={6}
					strokeOpacity={highlight}
					style={{ filter: "blur(3px)" }}
				/>
			)}
			<animated.path
				d={useAnimatedPath(path)}
				fill="none"
				stroke={color}
				strokeWidth={width}
				strokeOpacity={opacity}
			/>
		</g>
	);
}
