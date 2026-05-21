import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<>
			<main>
				<Outlet />
			</main>
			<Footer />
		</>
	);
}
