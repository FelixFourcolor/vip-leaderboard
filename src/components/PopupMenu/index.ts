import { Group } from "./Group";
import { Item } from "./Item";
import { Manager } from "./Manager";
import { Menu } from "./Menu";
import { Trigger } from "./Trigger";
import { Wrapper } from "./Wrapper";

export const PopupMenu = Object.assign(Wrapper, {
	Menu,
	Trigger,
	Manager,
	Group,
	Item,
});
