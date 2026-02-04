import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import styled from "styled-components";
import { useGetMonthlyData } from "./api/queries";
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
	const [cumulative, setCumulative] = useState(false);
	const data = useGetMonthlyData({ cumulative, top: 10, from: "2024-01" });
	if (!data) {
		return;
	}
	return <Chart data={data} setCumulative={setCumulative} height={600} />;
}
