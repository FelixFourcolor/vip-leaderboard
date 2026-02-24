import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { reaction, ticket, user } from "@/db/schema";
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
type TicketData = typeof ticket.$inferInsert;
type ReactionData = typeof reaction.$inferInsert;

async function load_data() {
	const usersMap = new Map<string, UserData>();
	const tickets: TicketData[] = [];
	const reactionsMap = new Map<string, ReactionData>();

	function getOrCreateUser({
		name,
		nickname,
		avatarUrl,
		color,
	}: User): string | undefined {
		if (!color) {
			return; // VIPs only
		}

		const id = name.toLowerCase(); // sql primary key may be case-insensitive
		const existing = usersMap.get(id);

		if (!existing) {
			const name = nickname;
			avatarUrl = avatarUrl.substring(0, avatarUrl.indexOf("?"));
			usersMap.set(id, { id, name, avatarUrl, color });
		}

		return id;
	}

	async function load_file(path: string) {
		const content = await readFile(path);
		const data: Data = JSON.parse(content.toString());

		data.messages.forEach(({ id: ticketId, timestamp, reactions }) => {
			const vipReactions = reactions.filter((r) =>
				VIP_REACTIONS.has(r.emoji.code),
			);
			if (vipReactions.length === 0) {
				return;
			}
			tickets.push({ id: ticketId, timestamp: new Date(timestamp) });
			vipReactions
				.flatMap((r) => r.users)
				.map(getOrCreateUser)
				.filter((userId) => userId !== undefined)
				.forEach((userId) => {
					const key = `${ticketId}-${userId}`;
					reactionsMap.set(key, { ticketId, userId });
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
		tickets,
		reactions: Array.from(reactionsMap.values()),
	};
}

async function main() {
	const data = load_data();
	const sqlite = new Database("public/leaderboard.db");
	const db = drizzle(sqlite);
	const { users, tickets, reactions } = await data;

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
	await db.insert(ticket).values(tickets).onConflictDoNothing();
	await db.insert(reaction).values(reactions).onConflictDoNothing();

	sqlite.close();
}

main();
