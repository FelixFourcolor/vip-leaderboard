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
type ActivityData = typeof activity.$inferInsert;

async function load_data() {
	const usersMap = new Map<string, UserData>();
	const activities: ActivityData[] = [];

	function getOrCreateUser({
		name,
		nickname,
		avatarUrl,
		color,
	}: User): string | undefined {
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
				.forEach((userId) => activities.push({ date, userId }));
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
		activities,
	};
}

async function main() {
	const data = load_data();
	const sqlite = new Database("public/db");
	const db = drizzle(sqlite);
	const { users, activities } = await data;
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
	await db.insert(activity).values(activities).onConflictDoNothing();
	await db.delete(user).where(isNull(user.color));
	sqlite.close();
}

main();
