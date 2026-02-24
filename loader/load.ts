import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { activity, user } from "@/db/schema";
import type { Data, User } from "./type.js";

const VIP_REACTIONS = new Set([
	"white_check_mark",
	"x",
	"hammer",
	"warning",
	"wastebasket",
	"lock",
]);

type UserData = typeof user.$inferInsert;
type ReactionData = typeof activity.$inferInsert;

async function load_data() {
	const usersMap = new Map<string, UserData>();
	const reactionsMap = new Map<string, ReactionData>();

	function getOrCreateUser({
		name,
		nickname,
		avatarUrl,
		color,
	}: User): string | undefined {
		const id = name.toLowerCase(); // sql primary key may be case-insensitive
		const existing = usersMap.get(id);

		if (!existing) {
			const name = nickname;

			const avatarParamIndex = avatarUrl.lastIndexOf("?");
			avatarUrl = avatarUrl.substring(
				"https://cdn.discordapp.com/".length,
				avatarParamIndex === -1 ? undefined : avatarParamIndex,
			);
			usersMap.set(id, { id, name, avatarUrl, color });
		} else if (color) {
			// idk why color is sometimes null, so update it when it's available
			existing.color = color;
		}

		return id;
	}

	async function load_file(path: string) {
		const content = await readFile(path);
		const data: Data = JSON.parse(content.toString());

		data.messages.forEach(({ timestamp, reactions }) => {
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
				.filter((userId) => userId !== undefined)
				.forEach((userId) => {
					const key = `${timestamp}-${userId}`;
					reactionsMap.set(key, { date, userId });
				});
		});
	}

	const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "data");
	await Promise.all(
		readdirSync(dataDir)
			.map((path) => resolve(dataDir, path))
			.map(load_file),
	);

	return {
		users: Array.from(usersMap.values()),
		reactions: Array.from(reactionsMap.values()),
	};
}

async function main() {
	const data = load_data();
	const sqlite = new Database("public/data.db");
	const db = drizzle(sqlite);
	const { users, reactions } = await data;
	await db
		.insert(user)
		.values(users)
		.onConflictDoUpdate({
			target: user.id,
			set: {
				name: sql`excluded.name`,
				avatarUrl: sql`excluded.avatar_url`,
				color: sql`excluded.color`,
			},
		});
	await db.insert(activity).values(reactions).onConflictDoNothing();
	await db.delete(user).where(isNull(user.color));
	sqlite.close();
}

main();
