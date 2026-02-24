export type User = {
	name: string;
	nickname: string;
	avatarUrl: string;
	color: string;
};

type Message = {
	id: string;
	timestamp: string;
	reactions: {
		emoji: { code: string };
		users: User[];
	}[];
};

export type Data = {
	messages: Message[];
};
