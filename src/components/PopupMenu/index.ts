import { Group } from "./Group";
import { Item } from "./Item";
import { Manager } from "./Manager";
import { Menu } from "./Menu";
import { PopupWrapper } from "./PopupWrapper";
import { Trigger } from "./Trigger";

export { usePopupMenu } from "./Manager";

export const PopupMenu = Object.assign(PopupWrapper, {
	Menu,
	Trigger,
	Manager,
	Group,
	Item,
});
