import { useEffect, useState } from "react";

const STORAGE_KEY = "zack-mode";

export function useZackMode() {
	const [isZack, setIsZack] = useState(
		() => getSessionStorage() ?? getBrowserPreference(),
	);

	useEffect(() => {
		updateTheme(isZack);
		setSessionStorage(isZack);
	}, [isZack]);

	return [isZack, setIsZack] as const;
}

function getSessionStorage() {
	const value = sessionStorage.getItem(STORAGE_KEY);
	return value === null ? null : value === "1";
}

function getBrowserPreference() {
	return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function updateTheme(isZack: boolean) {
	document.documentElement.setAttribute("data-theme", isZack ? "zack" : "");
}

function setSessionStorage(isZack: boolean) {
	sessionStorage.setItem(STORAGE_KEY, isZack ? "1" : "0");
}
