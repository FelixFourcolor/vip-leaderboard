import type { ActivityData, UserData } from "./db.js";
import type { Message, User } from "./types.js";

const VIP_REACTIONS = new Set([
	"white_check_mark",
	"x",
	"hammer",
	"warning",
	"wastebasket",
	"lock",
]);

export function aggregate(messages: Message[]) {
	const usersMap = new Map<string, UserData>();
	const activities: ActivityData[] = [];

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

	messages.forEach(({ author, timestamp, reactions }) => {
		getOrCreateUser(author);
		const vipReactions = reactions.filter((r) =>
			VIP_REACTIONS.has(r.emoji.code),
		);
		if (vipReactions.length === 0) {
			return;
		}
		const date = new Date(timestamp);
		vipReactions
			.flatMap((r) => r.users)
			.map(getOrCreateUser)
			.forEach((userId) => activities.push({ date, userId }));
	});

	return [Array.from(usersMap.values()), activities] as const;
}
