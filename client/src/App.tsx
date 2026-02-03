import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import "./styles.css";
import { Chart } from "./components/Chart";
import type { MonthlyData } from "./types";

const queryClient = new QueryClient();

export default function () {
	return (
		<QueryClientProvider client={queryClient}>
			<TestChart />
		</QueryClientProvider>
	);
}

function TestChart() {
	const { data = {} } = useQuery<MonthlyData>({
		queryKey: ["repoData"],
		queryFn: () =>
			fetch("api/monthly?from=2025&top=10").then((res) => res.json()),
	});
	return (
		<div style={{ height: 600, width: 900 }}>
			<Chart data={data} />
		</div>
	);
}
