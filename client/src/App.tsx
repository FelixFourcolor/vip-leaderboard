import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Removed styled-components usage; using inline styles instead.
import { Chart } from "@/components/Chart";
import { Footer } from "@/components/Footer";
import "./styles.css";

const queryClient = new QueryClient();

export default function () {
	return (
		<QueryClientProvider client={queryClient}>
			<div
				style={{
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					style={{
						flex: "1 0 auto",
						padding: "1rem",
					}}
				>
					<Chart height={500} />
				</div>
				<Footer />
			</div>
		</QueryClientProvider>
	);
}
