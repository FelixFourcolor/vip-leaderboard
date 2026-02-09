import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import styled from "styled-components";
import { useGetLastUpdated, useGetMonthlyData } from "./api/queries";
import { Chart } from "./components/Chart";
import { Footer } from "./components/Footer";
import { useLastDefined } from "./hooks/useLastDefined";
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
	const _lastUpdated = useGetLastUpdated();
	const toState = useState(() => _lastUpdated.toISOString().slice(0, 7));
	const fromState = useState(() => `${_lastUpdated.getUTCFullYear() - 1}-01`);
	const cumulativeState = useState(false);

	const [from] = fromState;
	const [to] = toState;
	const [cumulative] = cumulativeState;

	const queryData = useGetMonthlyData({ cumulative, top: 10, from, to });
	const data = useLastDefined(queryData);
	if (!data) {
		return null;
	}
	return (
		<Chart
			data={data}
			cumulative={cumulativeState}
			from={fromState}
			to={toState}
			height={500}
		/>
	);
}
