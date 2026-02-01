export type User = {
	name: string;
	nickname: string;
	avatarUrl: string;
	color: string | null;
};

type Message = {
	id: string;
	timestamp: string;
	author: User;
	reactions: {
		emoji: { code: string };
		users: User[];
	}[];
};

export type Data = {
	messages: Message[];
};
