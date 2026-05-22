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

	const countTickets = (messages: Message[]) =>
		messages.forEach(({ author, reactions, timestamp }) => {
			const authorId = getOrCreateUser(author);
			reactions
				.filter((r) => TICKET_RESOLVED_REACTIONS.has(r.emoji.code))
				.flatMap((r) => r.users)
				.map(getOrCreateUser)
				.filter((userId) => userId !== authorId)
				.forEach((userId) =>
					activitiesMap.set(`${timestamp}-${userId}`, {
						userId,
						date: new Date(timestamp),
						type: "ticket",
					}),
				);
		});

	const countWarnings = (messages: Message[]) =>
		messages.forEach(({ author, content, timestamp }) => {
			const recipientIds = content.match(USER_ID_REGEX);
			if (!recipientIds?.length) {
				return;
			}

			const date = new Date(timestamp);
			// Before this date, bans and warnings were in the same channel.
			// So only count if the post contains the word "warn"
			if (date < bansChannelCreationDate && !content.match(/warn/i)) {
				return;
			}

			recipientIds.forEach((recipientId) =>
				activitiesMap.set(`${timestamp}-${recipientId}`, {
					date,
					userId: getOrCreateUser(author),
					type: "warning",
				}),
			);
		});

	const countBans = (messages: Message[]) =>
		messages.forEach(({ author, content, reactions, timestamp }) => {
			// Count the :verified: reactions on auto ban announcements
			if (author.name === "Auto ban announcement") {
				reactions
					.filter((r) => r.emoji.code === "verified")
					.flatMap((r) => r.users)
					.map(getOrCreateUser)
					.forEach((userId) =>
						activitiesMap.set(`${timestamp}-${userId}`, {
							date: new Date(timestamp),
							userId,
							type: "ban",
						}),
					);

				return;
			}

			// Normal bans: count the message's author and those reacting with BAN_SUPPORT_REACTIONS
			// It doesn't matter whether the recipient was actually banned.

			const recipientIds = content.match(USER_ID_REGEX);
			if (!recipientIds?.length) {
				return;
			}

			const date = new Date(timestamp);
			// Before this date, bans and warnings were in the same channel.
			// So only count if the post contains the word "ban"
			if (date < bansChannelCreationDate && !content.match(/ban/i)) {
				return;
			}

			const authorId = getOrCreateUser(author);

			recipientIds.forEach((recipientId) =>
				activitiesMap.set(`${timestamp}-${recipientId}`, {
					date,
					userId: authorId,
					type: "ban",
				}),
			);

			reactions
				.filter((r) => BAN_SUPPORT_REACTIONS.has(r.emoji.code))
				.flatMap((r) => r.users)
				.map(getOrCreateUser)
				.filter((userId) => userId !== authorId)
				.forEach((userId) =>
					activitiesMap.set(`${timestamp}-${userId}`, {
						date,
						userId,
						type: "ban",
					}),
				);
		});

	channels.forEach(({ id, messages }) => {
		if (id === WARNINGS_CHANNEL_ID) {
			countWarnings(messages);
		} else if (id === BANS_CHANNEL_ID) {
			countBans(messages);
		} else {
			countTickets(messages);
		}
	});
	return {
		users: Array.from(usersMap.values()),
		activities: Array.from(activitiesMap.values()),
	};
}

const TICKET_RESOLVED_REACTIONS = new Set([
	"white_check_mark",
	"x",
	"wastebasket",
	"lock",
]);
const BAN_SUPPORT_REACTIONS = new Set([
	"thumbsup",
	"thumbsdown",
	"hammer",
	"white_check_mark",
	"x",
]);

const WARNINGS_CHANNEL_ID = "614936519710605408";
const BANS_CHANNEL_ID = "875213677530320897";
const USER_ID_REGEX = /(?<![a-z0-9])[a-z0-9]{64}(?![a-z0-9])/g;

const bansChannelCreationDate = new Date("2021-08-11T20:07:10.447-07:00");
