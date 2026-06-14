import {
	createContext,
	type ReactNode,
	use,
	useEffect,
	useEffectEvent,
	useRef,
	useState,
} from "react";
import type { Maybe, State, XY } from "@/utils/types";

type ResizeType = "resize-column" | "resize-row";
type DragType = "grab" | ResizeType;

type DragContextValue = State<
	{ isDragging: Maybe<DragType> },
	{ action: false }
>;
const DragContext = createContext<DragContextValue | null>(null);

export function DragManager({ children }: { children?: ReactNode }) {
	const [isDragging, _setIsDragging] = useState<Maybe<DragType>>();
	const setIsDragging = (type: Maybe<DragType>) => {
		_setIsDragging(type);
		if (type) {
			document.documentElement.setAttribute("data-is-dragging", type);
		} else {
			document.documentElement.removeAttribute("data-is-dragging");
		}
	};

	return (
		<DragContext value={{ isDragging, setIsDragging }}>{children}</DragContext>
	);
}

type EventXY = Pick<MouseEvent, "clientX" | "clientY">;

export function useDrag(): { isDragging: boolean };
// @ts-expect-error: idk, it works
export function useDrag(type: "grab"): State<{ isDragging: boolean }>;
export function useDrag(type: ResizeType): State<{ isDragging: boolean }>;
export function useDrag(
	type: "grab",
	onDrag: (delta: XY) => void,
	onDragEnd?: () => void,
): {
	isDragging: boolean;
	onMouseDown: (e: EventXY) => void;
};
export function useDrag(
	type: ResizeType,
	onDrag?: (delta: number) => void,
	onDragEnd?: () => void,
): {
	isDragging: boolean;
	onMouseDown: (e: EventXY) => void;
};
export function useDrag(
	type?: DragType,
	onDrag?: (delta: number | XY) => void,
	onDragEnd?: () => void,
) {
	const { isDragging, setIsDragging } = (() => {
		const context = use(DragContext);
		if (!context) {
			throw new Error("useDrag must be used within DragManager");
		}
		return context;
	})();

	const prevValueRef = useRef<Maybe<XY>>(undefined);
	const [isMouseDown, setIsMouseDown] = useState(false);

	const onMouseDown = (e: EventXY) => {
		setIsDragging(type);
		prevValueRef.current = { x: e.clientX, y: e.clientY };
		setIsMouseDown(true);
	};

	const onMouseMove = useEffectEvent(({ clientX, clientY }: MouseEvent) => {
		const prevValue = prevValueRef.current;
		if (!type || !prevValue) {
			return;
		}
		const delta = {
			x: clientX - prevValue.x,
			y: clientY - prevValue.y,
		};
		onDrag?.(
			type === "resize-row"
				? delta.y
				: type === "resize-column"
					? delta.x
					: delta,
		);
		prevValueRef.current = { x: clientX, y: clientY };
	});

	const onMouseUp = useEffectEvent(() => {
		setIsDragging(undefined);
		prevValueRef.current = undefined;
		setIsMouseDown(false);
		onDragEnd?.();
	});

	useEffect(() => {
		if (!isMouseDown) {
			return;
		}
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
		return () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};
	}, [isMouseDown]);

	return !type
		? { isDragging: !!isDragging }
		: {
				onMouseDown,
				isDragging: isMouseDown,
				setIsDragging: (isDragging: boolean) =>
					setIsDragging(isDragging ? type : undefined),
			};
}
