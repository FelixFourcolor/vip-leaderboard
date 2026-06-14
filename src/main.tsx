import "@/main.css";
import {
	createHashHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PopupMenu } from "./components/PopupMenu";
import { DragManager } from "./hooks/useDrag";
import { routeTree } from "./routeTree.gen";

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
			<DragManager>
				<RouterProvider router={router} />
			</DragManager>
		</PopupMenu.Manager>
	</StrictMode>,
);
