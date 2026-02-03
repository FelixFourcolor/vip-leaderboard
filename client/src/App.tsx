import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import styled from "styled-components";
import type { MonthlyData } from "./api/types";
import { Chart } from "./components/Chart";
import { Footer } from "./components/Footer";
import "./styles.css";

const queryClient = new QueryClient();

export default function () {
	return (
		<QueryClientProvider client={queryClient}>
			<Page>
				<Main>
					<TestChart />
				</Main>
				<Footer />
			</Page>
		</QueryClientProvider>
	);
}

const Page = styled.div`
	min-height: 100vh;
	display: flex;
	flex-direction: column;
`;

const Main = styled.div`
	flex: 1 0 auto;            
    padding: 1rem;
`;

function TestChart() {
	const { data = {} } = useQuery<MonthlyData>({
		queryKey: ["repoData"],
		queryFn: () =>
			fetch("api/monthly?from=2023&top=10").then((res) => res.json()),
	});
	return <Chart data={data} height={600} />;
}
