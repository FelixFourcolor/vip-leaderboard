import { Footer } from "@/components/Footer";
import "@/styles.css";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<div
			style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
		>
			<div style={{ flex: "1 0 auto", padding: "1rem" }}>
				<Outlet />
			</div>
			<Footer />
		</div>
	);
}
