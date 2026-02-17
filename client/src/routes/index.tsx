import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { type } from "arktype";
import { Chart } from "@/components/Chart";

const validate = type({
	"to?": "string | undefined",
	"from?": "string | undefined",
	"cumulative?": "boolean | undefined",
	"top?": "(1 <= number <= 10) | undefined",
}).narrow(({ to, from }) => {
	if (to) {
		const toDate = new Date(to);
		if (Number.isNaN(toDate.getTime())) {
			return false;
		}
	}
	if (from) {
		const fromDate = new Date(from);
		if (Number.isNaN(fromDate.getTime())) {
			return false;
		}
	}
	if (from && to && new Date(from) > new Date(to)) {
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
				from: undefined,
				to: undefined,
				cumulative: undefined,
				top: undefined,
			};
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
