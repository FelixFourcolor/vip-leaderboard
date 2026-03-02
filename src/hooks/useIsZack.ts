import { useSyncExternalStore } from "react";

const STORAGE_KEY = "is-zack";

export function useIsZack() {
	return useSyncExternalStore(subscribe, getSnapshot);
}

export function setIsZack(value: boolean) {
	isZack = value;
	updateDOM(value);
	setLocalStorage(value);
	listeners.forEach((lis) => lis());
}

let isZack = getLocalStorage() ?? getBrowserPreference();
updateDOM(isZack); // initialize on load

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};
const getSnapshot = () => isZack;

function getLocalStorage() {
	const value = localStorage.getItem(STORAGE_KEY);
	return !value ? null : value === "true";
}

function setLocalStorage(isZack: boolean) {
	localStorage.setItem(STORAGE_KEY, String(isZack));
}

function getBrowserPreference() {
	return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function updateDOM(isZack: boolean) {
	document.documentElement.setAttribute("data-is-zack", String(isZack));
}
