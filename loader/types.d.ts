type ChannelId = string;
type MessageId = string;
export type LastUpdateData = Record<ChannelId, MessageId>;

export type User = {
	name: string;
	nickname: string;
	avatarUrl: string;
	color: string | null;
};

export type Message = {
	id: MessageId;
	timestamp: string;
	author: User;
	content: string;
	reactions: {
		emoji: { code: string };
		users: User[];
	}[];
};

export type Data = {
	channel: { id: ChannelId };
	messages: Message[];
};
