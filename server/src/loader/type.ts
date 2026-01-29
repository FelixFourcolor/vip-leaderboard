type User = {
	id: string;
	name: string;
	roles: { name: string }[];
	isBot: boolean;
};

export type Message = {
	id: string;
	timestamp: string;
	author: User;
	embeds: unknown[];
	reactions: {
		emoji: { code: string };
		users: User[];
	}[];
};

export type Data = {
	messages: Message[];
};
