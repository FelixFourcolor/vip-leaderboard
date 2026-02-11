import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import styled from "styled-components";
import { Chart } from "@/components/Chart";
import { Footer } from "@/components/Footer";
import "./styles.css";

const queryClient = new QueryClient();

export default function () {
	return (
		<QueryClientProvider client={queryClient}>
			<Page>
				<Main>
					<Chart height={500} />
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
