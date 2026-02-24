import { memoize } from "es-toolkit";
import { getUser as getUserEndpoint } from "./endpoints";

export const getUser = memoize(
	async (userId: string) => getUserEndpoint(userId),
	{ getCacheKey: JSON.stringify },
);
