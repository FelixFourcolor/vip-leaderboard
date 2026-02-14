import {
	createFileRoute,
	retainSearchParams,
	stripSearchParams,
} from "@tanstack/react-router";
import { type } from "arktype";
import { getLastUpdated } from "@/api/queries";
import { Chart } from "@/components/Chart";
import { offset, toYyyyMm } from "@/utils/time";

const lastUpdated = await getLastUpdated().then(toYyyyMm);
const paramDefaults = {
	to: lastUpdated,
	from: offset(lastUpdated, { years: -2 }),
	cumulative: false,
	top: 5,
};

export const Route = createFileRoute("/")({
	component: RouteComponent,
	validateSearch: type({
		"from?": "string",
		"to?": "string",
		"cumulative?": "boolean",
		"top?": "number",
	}),
	search: {
		middlewares: [stripSearchParams(paramDefaults), retainSearchParams(true)],
	},
});

export const useSearch = () =>
	[{ ...paramDefaults, ...Route.useSearch() }, Route.useNavigate()] as const;

function RouteComponent() {
	return <Chart height={500} />;
}
