import type { ActivityData, UserData } from "./db.js";
import type { Message, User } from "./types.js";

export function aggregate(channels: { id: string; messages: Message[] }[]) {
	const usersMap = new Map<string, UserData>();
	const activitiesMap = new Map<string, ActivityData>();

	function getOrCreateUser({ name, nickname, avatarUrl, color }: User): string {
		const id = name.toLowerCase(); // sql primary key may be case-insensitive
		const existing = usersMap.get(id);

		const avatarParamIndex = avatarUrl.lastIndexOf("?");
		avatarUrl = avatarUrl.substring(
			"https://cdn.discordapp.com/".length,
			avatarParamIndex === -1 ? undefined : avatarParamIndex,
		);

		if (!existing) {
			const name = nickname;
			usersMap.set(id, { id, name, avatarUrl, color });
		} else {
			existing.avatarUrl = avatarUrl;
			// color is sometimes null, need to check
			if (color) {
				existing.color = color;
			}
		}

		return id;
	}

	const countReactions = (messages: Message[]) =>
		messages
			.map(modReactionsOnly)
			.filter(hasReactions)
			.forEach(({ reactions, timestamp }) => {
				const date = new Date(timestamp);
				reactions
					.flatMap((r) => r.users)
					.map(getOrCreateUser)
					.forEach((userId) =>
						activitiesMap.set(`${timestamp}-${userId}`, {
							date,
							userId,
							type: "reaction",
						}),
					);
			});

	const countWarnings = (messages: Message[]) =>
		messages.forEach(({ author, content, timestamp }) => {
			const recipientIds = content.match(USER_ID_REGEX) ?? [];
			if (recipientIds.length === 0) {
				return;
			}

			const userId = getOrCreateUser(author);
			const date = new Date(timestamp);

			recipientIds.forEach((recipientId) =>
				activitiesMap.set(`${timestamp}-${recipientId}`, {
					date,
					userId,
					type: "warning",
				}),
			);
		});

	channels.forEach(({ id, messages }) => {
		if (id === WARNINGS_CHANNEL_ID) {
			countWarnings(messages);
		} else {
			countReactions(messages);
		}
	});
	return {
		users: Array.from(usersMap.values()),
		activities: Array.from(activitiesMap.values()),
	};
}

const MOD_REACTIONS = new Set([
	"white_check_mark",
	"x",
	"hammer",
	"wastebasket",
	"lock",
]);
const modReactionsOnly = ({ reactions, ...rest }: Message) => {
	reactions = reactions.filter((r) => MOD_REACTIONS.has(r.emoji.code));
	return { ...rest, reactions };
};
const hasReactions = ({ reactions }: Message) => reactions.length > 0;

const WARNINGS_CHANNEL_ID = "614936519710605408";
const USER_ID_REGEX = /(?<![a-z0-9])[a-z0-9]{64}(?![a-z0-9])/g;
