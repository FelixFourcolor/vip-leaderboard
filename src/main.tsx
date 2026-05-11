import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GrabManager } from "./components/RangeSlider";
import { ResizeManager } from "./components/Resizer";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
	routeTree,
	basepath: "/vip-leaderboard/",
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<GrabManager>
			<ResizeManager>
				<RouterProvider router={router} />
			</ResizeManager>
		</GrabManager>
	</StrictMode>,
);

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
