import { useEffect } from "react";

export function useCursorDragged(isDragged: boolean) {
	useEffect(() => updateCursor(isDragged), [isDragged]);
}

function updateCursor(isDragged: boolean) {
	document.documentElement.setAttribute("data-is-cursor-dragged", String(isDragged));
}
