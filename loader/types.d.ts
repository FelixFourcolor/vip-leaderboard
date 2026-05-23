type ChannelId = string;
type MessageId = string;
export type LastUpdateData = Record<ChannelId, MessageId>;

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

export type Message = {
	id: MessageId;
	timestamp: string;
	author: User;
	content: string;
	reactions: Reaction[];
};

export type Channel = {
	channel: { id: ChannelId };
	messages: Message[];
};
