export interface User {
	name: string;
	avatarUrl: string;
	color: string | null;
}

export interface UserRanking extends User {
	id: string;
	tickets: number;
}

export type RankingData = UserRanking[];

export interface MonthTickets {
	month: string;
	count: number;
}

export interface UserMonthlyProfile extends User {
	tickets: MonthTickets[];
}

export type MonthlyData = Record<string, UserMonthlyProfile>;
