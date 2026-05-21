import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/Pages/Header";

export const Route = createRootRoute({ component: RootComponent });

function RootComponent() {
	return (
		<>
			<Header />
			<main>
				<Outlet />
			</main>
		</>
	);
}
