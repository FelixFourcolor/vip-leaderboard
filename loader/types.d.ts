export type User = {
	name: string;
	nickname: string;
	avatarUrl: string;
	color: string | null;
};

type Reaction = {
	emoji: { code: string };
	users: User[];
};

type Embed = {
	title: string;
	description: string;
};

export type Message = {
	id: string;
	timestamp: string;
	author: User;
	content: string;
	reactions: Reaction[];
	embeds: Embed[];
};

export type Channel = {
	channel: { id: string };
	messages: Message[];
};
