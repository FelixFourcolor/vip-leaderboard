import { useEffect, useState } from "react";
import { Toggle } from "@/components/Toggle";
import { UserHeader } from "@/components/UserHeader";

export function ZackModeToggle() {
	const [isZack, setIsZack] = useZackMode();

	return (
		<Toggle
			initial={isZack}
			onChange={setIsZack}
			customStyles={{
				container: {
					backgroundColor: isZack ? "#68D5F8" : undefined,
				},
				slider: {
					backgroundImage: `url("https://cdn.discordapp.com/avatars/1000499951597523125/54c74dd3bf04d27bd73479a1f9935a52.png?size=16")`,
				},
			}}
		>
			<UserHeader name="Zack mode" color="#68D5F8" />
		</Toggle>
	);
}

const STORAGE_KEY = "zack-mode";

function useZackMode() {
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
