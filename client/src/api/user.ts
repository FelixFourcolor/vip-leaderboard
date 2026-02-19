import type { UserData } from "@server/api";
import { memoize } from "es-toolkit";

export const getUser = memoize(
	(userId: string): Promise<UserData> => {
		const url = `/api/user/${userId}`;
		return fetch(url).then((res) => res.json());
	},
	{ getCacheKey: JSON.stringify },
);
