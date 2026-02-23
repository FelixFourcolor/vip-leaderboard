import type { UserData } from "@server/api";
import { memoize } from "es-toolkit";
import { getUser as getUserEndpoint } from "./endpoints";

export const getUser = memoize(
	async (userId: string): Promise<UserData> => {
		return getUserEndpoint(userId);
	},
	{ getCacheKey: JSON.stringify },
);
