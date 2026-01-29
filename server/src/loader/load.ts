import { readFileSync } from "node:fs";
import { MikroORM } from "@mikro-orm/mysql";
import { Reaction } from "../modules/reaction.entity.js";
import { Ticket } from "../modules/ticket.entity.js";
import { User } from "../modules/user.entity.js";
import type { Data, Message } from "./type.js";

const VIP_ROLE_NAME = "VIP";
const CHECKMARK_CODES = ["white_check_mark", "x"];

async function loadDb() {
	const orm = await MikroORM.init();
	await orm.schema.refreshDatabase();
	return orm;
}

async function load() {
	const ormPromise = loadDb();
	const usersMap = new Map<User["id"], User>();
	const ticketsMap = new Map<Ticket["id"], Ticket>();
	const reactionsMap = new Map<`${Ticket["id"]}-${User["id"]}`, Reaction>();

	const content = readFileSync("data.json");
	const data: Data = JSON.parse(content.toString());

	const ticketMessages: Pick<Message, "id" | "reactions">[] = [];
	for (const { id, timestamp, author, embeds, reactions } of data.messages) {
		if (author.isBot) {
			continue;
		}
		const userId = BigInt(author.id);
		let user = usersMap.get(userId);
		if (!user) {
			user = new User(
				userId,
				author.name,
				author.roles.some((r) => r.name === VIP_ROLE_NAME),
			);
			usersMap.set(userId, user);
		}

		const checkmarks = reactions.filter((r) =>
			CHECKMARK_CODES.includes(r.emoji.code),
		);
		const isTicket = embeds.length > 0 || checkmarks.length > 0;
		if (isTicket) {
			const ticketId = BigInt(id);
			ticketMessages.push({ id, reactions: checkmarks });
			ticketsMap.set(ticketId, new Ticket(ticketId, user, new Date(timestamp)));
		}
	}

	for (const { id: ticketStrId, reactions: checkmarks } of ticketMessages) {
		const ticketId = BigInt(ticketStrId);
		const ticket = ticketsMap.get(ticketId)!;
		for (const { id: userStrId } of checkmarks.flatMap((r) => r.users)) {
			const userId = BigInt(userStrId);
			const user = usersMap.get(userId);
			if (!user) {
				console.error(`User ${userId} not found for ticket ${ticketId}`);
				continue;
			}
			const reactionId = `${ticketId}-${userId}` as const;
			if (reactionsMap.has(reactionId)) {
				console.error(`Duplicate reaction for ${ticketId} by ${userId}`);
				continue;
			}
			reactionsMap.set(reactionId, new Reaction(ticket, user));
		}
	}

	const orm = await ormPromise;
	const db = orm.em.fork();
	db.persist(usersMap.values());
	db.persist(ticketsMap.values());
	db.persist(reactionsMap.values());
	await db.flush();
	await orm.close();
}

load();
