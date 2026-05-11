import {
	createContext,
	type ReactNode,
	use,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

type ResizeType = "row" | "column";

interface PublicContextValue {
	isResizing: ResizeType | null;
}

interface PrivateContextValue extends PublicContextValue {
	delta: number;
	onResize: (resizing: ResizeType, value: number) => void;
}

const ResizeContext = createContext<PrivateContextValue | null>(null);

export function ResizeManager({ children }: { children: ReactNode }) {
	const [isResizing, _setIsResizing] = useState<ResizeType | null>(null);
	const setIsResizing = useCallback((resizing: ResizeType | null) => {
		_setIsResizing(resizing);
		if (resizing) {
			document.documentElement.setAttribute("data-is-resizing", resizing);
		} else {
			document.documentElement.removeAttribute("data-is-resizing");
		}
	}, []);

	const valueRef = useRef<number | null>(null);
	const [delta, setDelta] = useState(0);

	const onResize = useCallback(
		(resizing: ResizeType, value: number) => {
			setIsResizing(resizing);
			valueRef.current = value;
			setDelta(0);
		},
		[setIsResizing],
	);
	const onMouseMove = useCallback(
		({ clientX, clientY }: MouseEvent) => {
			if (!isResizing || valueRef.current === null) {
				return;
			}
			if (isResizing === "column") {
				setDelta(clientX - valueRef.current);
				valueRef.current = clientX;
			} else {
				setDelta(clientY - valueRef.current);
				valueRef.current = clientY;
			}
		},
		[isResizing],
	);
	const onResizeEnd = useCallback(() => {
		setIsResizing(null);
		setDelta(0);
	}, [setIsResizing]);

	useEffect(() => {
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onResizeEnd);
		return () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onResizeEnd);
		};
	}, [onMouseMove, onResizeEnd]);

	return (
		<ResizeContext.Provider value={{ isResizing, delta, onResize }}>
			{children}
		</ResizeContext.Provider>
	);
}

export function useResizePrivate() {
	const context = use(ResizeContext);
	if (!context) {
		throw new Error("useResize must be used within a ResizeManager");
	}
	return context;
}

export const useResize: () => PublicContextValue = useResizePrivate;
