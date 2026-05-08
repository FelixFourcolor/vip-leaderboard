import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { type } from "arktype";
import { Chart } from "@/components/Chart";

const validate = type({
	"until?": "string | undefined",
	"since?": "string | undefined",
	"cumulative?": "boolean | undefined",
	"stacked?": "boolean | undefined",
}).narrow(({ until, since }) => {
	if (until) {
		const untilDate = new Date(until);
		if (Number.isNaN(untilDate.getTime())) {
			return false;
		}
	}
	if (since) {
		const sinceDate = new Date(since);
		if (Number.isNaN(sinceDate.getTime())) {
			return false;
		}
	}
	if (since && until && new Date(since) > new Date(until)) {
		return false;
	}
	return true;
});

export const Route = createFileRoute("/")({
	component: RouteComponent,
	validateSearch: (search) => {
		const out = validate(search);
		if (out instanceof type.errors) {
			console.log(out.summary);
			return {
				since: undefined,
				until: undefined,
				cumulative: undefined,
				stacked: undefined,
			} satisfies typeof validate.infer;
		}
		return out;
	},
	search: {
		middlewares: [retainSearchParams(true)],
	},
});

function RouteComponent() {
	return <Chart />;
}
