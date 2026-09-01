import type { ActivityData, UserData } from "./data-save";
import type { Channel, Message, User } from "./types";

export function countActivities(channels: Channel[]) {
	const usersData: (UserData & { date: Date })[] = [];
	const activitiesMap = new Map<string, ActivityData>();

	const registerUser =
		(timestamp: string) =>
		({ name, nickname, avatarUrl, color }: User): string => {
			const id = name.toLowerCase(); // sql primary key may be case-insensitive
			const avatarParamIndex = avatarUrl.lastIndexOf("?");
			avatarUrl = avatarUrl.substring(
				"https://cdn.discordapp.com/".length,
				avatarParamIndex === -1 ? undefined : avatarParamIndex,
			);
			usersData.push({
				id,
				name: nickname,
				avatarUrl,
				color,
				date: new Date(timestamp),
			});
			return id;
		};

	const countReports = (messages: Message[]) =>
		messages.forEach(({ id, author, reactions, timestamp }) => {
			const date = new Date(timestamp);
			const getUserId = registerUser(timestamp);
			const authorId = getUserId(author);

			reactions
				.filter((r) => TICKET_RESOLVED_REACTIONS.has(r.emoji.code))
				.flatMap((r) => r.users)
				.map(getUserId)
				.filter((userId) => userId !== authorId)
				.forEach((userId) =>
					activitiesMap.set(`${id}-${userId}`, {
						userId,
						date,
						type: "report",
					}),
				);
		});

	const countWarnings = (messages: Message[]) =>
		messages.forEach(({ id, author, content, timestamp, forwardedMessage }) => {
			const getUserId = registerUser(timestamp);
			getUserId(author);

			const recipientIds = content.match(USER_ID_REGEX);
			if (!recipientIds?.length) {
				return;
			}

			const realContent = `${forwardedMessage?.content ?? ""}\n${content}`;

			const date = new Date(timestamp);
			// Before this date, bans and warnings were in the same channel.
			// So only count if the message contains the word "warn"
			if (date < bansChannelCreationDate && !realContent.match(/warn/i)) {
				return;
			}

			recipientIds.forEach((recipientId) =>
				activitiesMap.set(`${id}-${recipientId}`, {
					date,
					userId: getUserId(author),
					type: "warning",
				}),
			);
		});

	const countBans = (messages: Message[]) =>
		messages.forEach(
			({
				id,
				author,
				content,
				reactions,
				embeds,
				timestamp,
				forwardedMessage,
			}) => {
				const getUserId = registerUser(timestamp);
				const authorId = getUserId(author);

				// Count the :verified: reactions on auto ban announcements
				const autoban = embeds.find((e) => e.title === "Auto banned user");
				if (autoban) {
					const date = new Date(timestamp);
					const recipientIds = autoban.description.match(USER_ID_REGEX);

					recipientIds?.forEach((recipientId) => {
						reactions
							.filter((r) => r.emoji.code === "verified")
							.flatMap((r) => r.users)
							.map(getUserId)
							.forEach((userId) =>
								// intentionally not including message ID in the key
								// because sometimes autobans have duplicate user IDs
								activitiesMap.set(`${recipientId}-${userId}`, {
									date,
									userId,
									type: "ban",
								}),
							);
					});
					return;
				}

				// Normal bans: count the message's author and those reacting with BAN_SUPPORT_REACTIONS
				// It doesn't matter whether the recipient was actually banned.
				const realContent = `${forwardedMessage?.content ?? ""}\n${content}`;
				const recipientIds = realContent.match(USER_ID_REGEX);
				if (!recipientIds?.length) {
					return;
				}

				const date = new Date(timestamp);
				if (date < bansChannelCreationDate && !realContent.match(/ban/i)) {
					return;
				}

				recipientIds.forEach((recipientId) =>
					activitiesMap.set(`${id}-${recipientId}`, {
						date,
						userId: authorId,
						type: "ban",
					}),
				);

				reactions
					.filter((r) => BAN_SUPPORT_REACTIONS.has(r.emoji.code))
					.flatMap((r) => r.users)
					.map(getUserId)
					.filter((userId) => userId !== authorId)
					.forEach((userId) =>
						activitiesMap.set(`${id}-${userId}`, {
							date,
							userId,
							type: "ban",
						}),
					);
			},
		);

	channels.forEach(({ channel: { id }, messages }) => {
		if (id === WARNINGS_CHANNEL_ID) {
			countWarnings(messages);
		} else if (id === BANS_CHANNEL_ID) {
			countBans(messages);
		} else {
			countReports(messages);
		}
	});
	return {
		users: usersData.sort((u1, u2) => u1.date.valueOf() - u2.date.valueOf()),
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
	"white_check_mark",
	"hammer",
	"thumbsup",
	"thumbup",
	"ehh",
	"thumbsdown",
	"thumbdown",
	"x",
]);

const WARNINGS_CHANNEL_ID = "614936519710605408";
const BANS_CHANNEL_ID = "875213677530320897";
const USER_ID_REGEX = /(?<![a-z0-9])[a-z0-9]{64}(?![a-z0-9])/g;

const bansChannelCreationDate = new Date("2021-08-11T20:07:10.447-07:00");
