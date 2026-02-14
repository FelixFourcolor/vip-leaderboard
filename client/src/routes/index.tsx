import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { type } from "arktype";
import { Chart } from "@/components/Chart";

export const Route = createFileRoute("/")({
	component: RouteComponent,
	validateSearch: type({
		"from?": "string",
		"to?": "string",
		"cumulative?": "boolean",
		"top?": "number",
	}),
	search: {
		middlewares: [retainSearchParams(true)],
	},
});

function RouteComponent() {
	return <Chart height={500} />;
}
