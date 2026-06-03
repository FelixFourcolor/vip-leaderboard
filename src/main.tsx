import {
	createHashHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GrabManager } from "./components/RangeSlider";
import { ResizeManager } from "./components/Resizer";
import { routeTree } from "./routeTree.gen";
import "@/main.css";
import { PopupMenu } from "./components/PopupMenu";

const router = createRouter({
	routeTree,
	history: createHashHistory(),
	defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<PopupMenu.Manager>
			<GrabManager>
				<ResizeManager>
					<RouterProvider router={router} />
				</ResizeManager>
			</GrabManager>
		</PopupMenu.Manager>
	</StrictMode>,
);
