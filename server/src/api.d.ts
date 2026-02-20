import type {
	basicHandler,
	rankingHandler,
	timeHandler,
} from "./queryHandler.ts";

export type UserDataParams = typeof basicHandler.inferIn;
export type UserData = {
	name: string;
	avatarUrl: string;
	color: string;
} | null;

export type MonthlyCountParams = typeof timeHandler.inferIn;
export type MonthlyCount = { month: string; count: number }[];

export type RankingParams = typeof rankingHandler.inferIn;
export type RankingData = Record<string, { rank: number; count: number }>;
