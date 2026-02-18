import { Footer } from "@/components/Footer";
import "@/styles.css";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<>
			<div id="main">
				<Outlet />
			</div>
			<Footer />
		</>
	);
}
