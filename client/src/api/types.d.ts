export interface User {
	name: string;
	avatarUrl: string;
	color: string | null;
	rank: number;
	count: number;
}

export interface RankedUser extends User {
	rank: number;
}

export interface RankingParams {
	from?: string;
	to?: string;
	top?: number;
}

export type RankingData = Record<string, RankedUser>;

export interface MonthlyDataParams extends RankingParams {
	cumulative?: boolean;
}

export type MonthlyData = Record<
	string,
	Array<{ month: string; count: number }>
>;
