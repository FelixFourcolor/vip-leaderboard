import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { createConnection } from "../db.js";
import { reaction, ticket, user } from "../schema.js";
import type { Data, User as UserDTO } from "./type.js";

const VIP_REACTIONS = [
	"white_check_mark",
	"x",
	"hammer",
	"warning",
	"wastebasket",
	"lock",
];

type UserData = typeof user.$inferInsert;
type TicketData = typeof ticket.$inferInsert;
type ReactionData = typeof reaction.$inferInsert;

const usersMap = new Map<string, UserData>();
const tickets: TicketData[] = [];
const reactionsSet = new Set<string>();
const reactions: ReactionData[] = [];

function getOrCreateUser({
	name,
	nickname,
	avatarUrl,
	color,
}: UserDTO): string | undefined {
	if (!color) {
		return;
	}
	name = name.toLowerCase(); // sql primary key may be case-insensitive
	const existing = usersMap.get(name);
	if (!existing) {
		usersMap.set(name, {
			id: name,
			name: nickname,
			avatarUrl: avatarUrl.substring(0, avatarUrl.indexOf("?")),
			color,
		});
	}
	return name;
}

async function load_file(file: string) {
	const content = await readFile(file);
	const data: Data = JSON.parse(content.toString());

	for (const { id, timestamp, reactions: msgReactions } of data.messages) {
		const vipReactions = msgReactions.filter((r) =>
			VIP_REACTIONS.includes(r.emoji.code),
		);
		if (vipReactions.length === 0) {
			continue;
		}

		const ticketId = BigInt(id);
		tickets.push({
			id: ticketId,
			timestamp: new Date(timestamp),
		});

		for (const u of vipReactions.flatMap((r) => r.users)) {
			const reactorId = getOrCreateUser(u);
			if (!reactorId) {
				continue;
			}
			const reactionKey = `${ticketId}-${reactorId}`;
			if (!reactionsSet.has(reactionKey)) {
				reactionsSet.add(reactionKey);
				reactions.push({
					ticketId,
					userId: reactorId,
				});
			}
		}
	}
}

function load_data() {
	const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "data");
	return Promise.all(
		readdirSync(dataDir)
			.map((f) => resolve(dataDir, f))
			.map(load_file),
	);
}

async function main() {
	const [{ db, connection }] = await Promise.all([
		createConnection(),
		load_data(),
	]);

	await db
		.insert(user)
		.values(Array.from(usersMap.values()))
		.onDuplicateKeyUpdate({
			set: {
				name: sql`VALUES(name)`,
				avatarUrl: sql`VALUES(avatar_url)`,
				color: sql`VALUES(color)`,
			},
		});
	await db
		.insert(ticket)
		.values(tickets)
		.onDuplicateKeyUpdate({
			set: { id: sql`VALUES(id)` },
		});
	await db
		.insert(reaction)
		.values(reactions)
		.onDuplicateKeyUpdate({
			set: { ticketId: sql`VALUES(ticket_id)` },
		});

	await connection.end();
}

main();
