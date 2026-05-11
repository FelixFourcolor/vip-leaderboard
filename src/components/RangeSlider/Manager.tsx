import {
	createContext,
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useState,
} from "react";

interface ContextValue {
	isGrabbing: boolean;
	setIsGrabbing: (value: boolean) => void;
}

const GrabbingContext = createContext<ContextValue | null>(null);

export function GrabManager({ children }: { children: ReactNode }) {
	const [isGrabbing, _setIsGrabbing] = useState(false);
	const setIsGrabbing = useCallback((value: boolean) => {
		_setIsGrabbing(value);
		document.documentElement.setAttribute("data-is-grabbing", String(value));
	}, []);

	return (
		<GrabbingContext.Provider value={{ isGrabbing, setIsGrabbing }}>
			{children}
		</GrabbingContext.Provider>
	);
}

export function useGrab() {
	const context = use(GrabbingContext);
	if (!context) {
		throw new Error("useGrab must be used within a GrabManager");
	}
	return context;
}

export function useIsGrabbing(value: boolean) {
	const { setIsGrabbing } = useGrab();

	useEffect(() => setIsGrabbing(value), [value, setIsGrabbing]);
}
