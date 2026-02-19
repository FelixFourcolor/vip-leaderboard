import type { RankingData, RankingParams } from "@server/api";
import { memoize } from "es-toolkit";
import { createUrlParams } from "@/utils/url";

export const getRanking = memoize(
	(params: RankingParams): Promise<RankingData> => {
		const url = `/api/ranking${createUrlParams(params)}`;
		return fetch(url).then((res) => res.json());
	},
	{ getCacheKey: JSON.stringify },
);
